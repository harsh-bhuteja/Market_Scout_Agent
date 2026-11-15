from __future__ import annotations

import json
import math
from datetime import datetime

from langchain_core.messages import AIMessage, ToolMessage
from langgraph.types import interrupt

from services.country import infer_country
from services.dedupe import deduplicate
from tools.adzuna import AdzunaError


def _log(stage: int, text: str, level: str = "agent") -> dict:
    return {
        "timestamp": datetime.now().strftime("%H:%M:%S"),
        "stageId": stage,
        "text": text,
        "level": level,
    }


def plan_adzuna_calls(state: dict) -> dict:
    plan = state.get("search_plan") or {}
    request = state.get("request") or {}
    location = plan.get("locationScope") or request.get("location") or ""
    country = state.get("country") or infer_country(location)
    target = int(plan.get("targetPostingsCount") or 200)
    per_page = 50
    pages = min(8, max(1, math.ceil(target / per_page)))
    attempt = int(state.get("fetch_attempts") or 0)
    query_titles = plan.get("titleSynonyms") or [plan.get("roleQuery") or request.get("role") or ""]
    primary_role = plan.get("roleQuery") or (query_titles[0] if query_titles else "") or request.get("role") or ""
    query = primary_role
    if state.get("low_data_decision") == "add_synonyms" and len(query_titles) > 1:
        query = query_titles[1]
    radius = int(plan.get("radiusKm") or 35)
    if state.get("low_data_decision") == "broaden_radius":
        radius += 50
    tool_calls = []
    for page in range(1, pages + 1):
        tool_calls.append(
            {
                "name": "adzuna_job_search",
                "args": {
                    "query": query,
                    "location": location,
                    "country": country,
                    "page": page,
                    "results_per_page": per_page,
                    "max_days_old": int(plan.get("dateRangeDays") or 30),
                    "radius_km": radius,
                },
                "id": f"adzuna_{attempt}_{page}",
                "type": "tool_call",
            }
        )
    msg = AIMessage(content="Fetch live Adzuna postings", tool_calls=tool_calls)
    return {
        "messages": [msg],
        "current_stage": 3,
        "fetch_attempts": attempt + 1,
        "logs": [
            _log(
                3,
                f'Tool invocation: adzuna_job_search(country="{country}", pages={pages}, radius={radius}km)',
                "tool",
            )
        ],
    }


def ingest_postings(state: dict) -> dict:
    collected: list[dict] = []
    errors: list[str] = []
    for msg in state.get("messages") or []:
        if not isinstance(msg, ToolMessage):
            continue
        content = msg.content
        if isinstance(content, str):
            try:
                payload = json.loads(content)
            except json.JSONDecodeError:
                if content.startswith("Error") or "Adzuna" in content:
                    errors.append(content)
                    continue
                raise
        elif isinstance(content, dict):
            payload = content
        else:
            continue
        if payload.get("error"):
            errors.append(str(payload["error"]))
            continue
        collected.extend(payload.get("results") or [])

    if errors and not collected:
        raise AdzunaError(errors[-1])

    existing = list(state.get("postings") or [])
    merged = existing + collected
    unique, dupes = deduplicate(merged)
    raw_count = int(state.get("postings_fetched_raw") or 0) + len(collected)
    return {
        "postings": unique,
        "duplicates_removed": int(state.get("duplicates_removed") or 0) + dupes,
        "postings_fetched_raw": raw_count,
        "current_stage": 3,
        "logs": [
            _log(
                3,
                f"Fetched {len(collected)} raw postings this wave. Unique total={len(unique)}; duplicates removed={dupes}.",
                "tool",
            )
        ],
    }


def sufficiency_node(state: dict) -> dict:
    postings = state.get("postings") or []
    plan = state.get("search_plan") or {}
    min_postings = int(state.get("min_postings") or 20)
    target = int(plan.get("targetPostingsCount") or 200)
    attempts = int(state.get("fetch_attempts") or 0)
    max_attempts = int(state.get("max_fetch_attempts") or 2)
    count = len(postings)

    if count >= min_postings:
        return {
            "sufficient": True,
            "current_stage": 3,
            "logs": [_log(3, f"Sufficiency threshold passed: {count} unique postings.", "success")],
        }

    if attempts < max_attempts and state.get("low_data_decision") != "proceed_with_sparse":
        updated_plan = dict(plan)
        updated_plan["radiusKm"] = int(plan.get("radiusKm") or 35) + 25
        return {
            "sufficient": False,
            "search_plan": updated_plan,
            "low_data_decision": "auto_broaden",
            "current_stage": 3,
            "logs": [
                _log(
                    3,
                    f"Low volume ({count} < {min_postings}). Auto-refining search (attempt {attempts}/{max_attempts}).",
                    "agent",
                )
            ],
        }

    if state.get("low_data_decision") == "proceed_with_sparse":
        return {
            "sufficient": True,
            "confidence_floor": "Low",
            "current_stage": 3,
            "logs": [_log(3, "Proceeding with weak sample; confidence will be downgraded.", "hitl")],
        }

    payload = {
        "id": "cp-low-data",
        "stageId": 3,
        "type": "low_data_decision",
        "title": "Human-in-the-Loop: Sparse Results",
        "description": "Retrieved fewer postings than the statistical minimum.",
        "timestamp": datetime.now().strftime("%H:%M:%S"),
        "lowDataDecision": {
            "currentCount": count,
            "targetCount": max(min_postings, target // 4),
            "attemptsMade": attempts,
            "maxAttempts": max_attempts,
            "reason": "Insufficient unique, relevant postings after configured retries.",
            "options": [
                {
                    "id": "broaden_radius",
                    "title": "Broaden search radius",
                    "description": "Expand radius by +50 km.",
                    "actionType": "broaden_radius",
                },
                {
                    "id": "add_synonyms",
                    "title": "Include adjacent titles",
                    "description": "Add adjacent title variations.",
                    "actionType": "add_synonyms",
                },
                {
                    "id": "proceed_with_sparse",
                    "title": "Proceed with weak sample",
                    "description": "Continue and downgrade confidence.",
                    "actionType": "proceed_with_sparse",
                },
            ],
        },
    }
    decision = interrupt(payload)
    action = decision
    if isinstance(decision, dict):
        action = decision.get("action") or decision.get("decision") or decision.get("id")
    action = str(action or "proceed_with_sparse")
    if action == "proceed_with_sparse":
        return {
            "low_data_decision": action,
            "sufficient": True,
            "confidence_floor": "Low",
            "current_stage": 3,
            "logs": [_log(3, "Operator chose to proceed with sparse evidence.", "hitl")],
        }
    plan = dict(state.get("search_plan") or {})
    if action == "broaden_radius":
        plan["radiusKm"] = int(plan.get("radiusKm") or 35) + 50
    return {
        "low_data_decision": action,
        "search_plan": plan,
        "sufficient": False,
        "max_fetch_attempts": attempts + 1,
        "current_stage": 3,
        "logs": [_log(3, f'Operator decision: "{action}". Re-running retrieval.', "hitl")],
    }
