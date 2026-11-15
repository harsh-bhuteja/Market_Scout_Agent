from __future__ import annotations

from datetime import datetime

from langgraph.types import interrupt

from schemas.search_plan import SearchPlan
from services.country import infer_country
from services.skills import SKILL_ALIASES


def _log(stage: int, text: str, level: str = "agent") -> dict:
    return {
        "timestamp": datetime.now().strftime("%H:%M:%S"),
        "stageId": stage,
        "text": text,
        "level": level,
    }


def _default_plan(request: dict) -> SearchPlan:
    role = request.get("role") or "Software Engineer"
    location = request.get("location") or ""
    seniority = request.get("seniority") or "Any"
    synonyms = [role]
    if seniority not in ("Any", "") and seniority.lower() not in role.lower():
        synonyms.append(f"{seniority} {role}")
    if "analyst" in role.lower():
        synonyms += ["Business Intelligence Analyst", "Analytics Engineer", "Product Analyst"]
    elif "software" in role.lower() or "engineer" in role.lower():
        synonyms += ["Software Developer", "Backend Engineer", "Full Stack Engineer"]
    elif "data" in role.lower():
        synonyms += ["Data Analyst", "Analytics Engineer", "BI Analyst"]
    else:
        synonyms.append(f"{role} Specialist")
    # unique
    seen = set()
    title_synonyms = []
    for s in synonyms:
        if s and s.lower() not in seen:
            seen.add(s.lower())
            title_synonyms.append(s)

    keywords = []
    blob = f"{role} {request.get('clientPurpose') or ''} {' '.join(request.get('focusAreas') or [])}".lower()
    for alias, canonical in SKILL_ALIASES.items():
        if alias in blob and canonical not in keywords:
            keywords.append(canonical)
    if not keywords:
        if "data" in role.lower() or "analyst" in role.lower():
            keywords = ["SQL", "Python", "Analytics"]
        elif "ml" in role.lower() or "ai" in role.lower():
            keywords = ["Python", "Machine Learning", "PyTorch"]
        else:
            keywords = ["Python", "SQL", "Cloud"]

    negatives = ["Internship", "Data Entry", "Unpaid"]
    return SearchPlan(
        roleQuery=role,
        titleSynonyms=title_synonyms[:6],
        locationScope=location,
        radiusKm=35,
        dateRangeDays=30,
        targetPostingsCount=200,
        keywords=keywords[:8],
        negativeKeywords=negatives,
    )


def search_plan_node(state: dict) -> dict:
    request = state.get("request") or {}
    plan = _default_plan(request)
    country = infer_country(request.get("location") or plan.locationScope)
    return {
        "search_plan": plan.model_dump(),
        "country": country,
        "current_stage": 2,
        "logs": [
            _log(2, f'Formulating title synonyms for "{plan.roleQuery}"...'),
            _log(2, "Drafting search plan: keywords, exclusions, geographic radius.", "tool"),
        ],
    }


def plan_approval_node(state: dict) -> dict:
    if state.get("plan_approved") and state.get("search_plan"):
        return {"current_stage": 2}
    payload = {
        "id": "cp-plan-approval",
        "stageId": 2,
        "type": "search_plan_approval",
        "title": "Human-in-the-Loop: Search Plan Review & Sign-Off",
        "description": "Verify and refine search parameters before consuming job-board API credits.",
        "timestamp": datetime.now().strftime("%H:%M:%S"),
        "searchPlanDraft": state.get("search_plan"),
    }
    decision = interrupt(payload)
    plan = dict(state.get("search_plan") or {})
    if isinstance(decision, dict):
        incoming = decision.get("plan") or decision.get("searchPlan") or decision
        if isinstance(incoming, dict) and incoming.get("roleQuery"):
            plan.update({k: incoming[k] for k in incoming if k in plan or k in SearchPlan.model_fields})
    return {
        "search_plan": plan,
        "plan_approved": True,
        "current_stage": 2,
        "logs": [
            _log(
                2,
                f"Search plan confirmed: {len(plan.get('titleSynonyms') or [])} title variations, "
                f"{plan.get('radiusKm')}km radius.",
                "success",
            )
        ],
    }
