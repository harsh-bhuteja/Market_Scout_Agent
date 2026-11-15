from __future__ import annotations

from datetime import datetime, timezone

from langgraph.types import interrupt

from services.clarity import assess_clarity


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _log(stage: int, text: str, level: str = "agent") -> dict:
    return {
        "timestamp": datetime.now().strftime("%H:%M:%S"),
        "stageId": stage,
        "text": text,
        "level": level,
    }


def intake_node(state: dict) -> dict:
    request = state.get("request") or {}
    role = request.get("role", "")
    location = request.get("location", "")
    assessment = assess_clarity(role, location)
    logs = [
        _log(1, f'Intake initialized for role: "{role}" in "{location}".'),
        _log(1, "Evaluating query ambiguity against role/location heuristics...", "agent"),
    ]
    if assessment["needs_clarification"]:
        logs.append(
            _log(
                1,
                "Ambiguity detected. Pausing for targeted clarification.",
                "hitl",
            )
        )
    else:
        logs.append(_log(1, "Role and location are sufficiently specific.", "success"))
    return {
        "current_stage": 1,
        "status": "in_progress",
        "needs_clarification": assessment["needs_clarification"],
        "clarification_questions": assessment["questions"],
        "started_at": state.get("started_at") or _now(),
        "logs": logs,
    }


def clarification_node(state: dict) -> dict:
    if not state.get("needs_clarification"):
        return {"current_stage": 1, "status": "in_progress"}
    if state.get("clarification_answers"):
        return {"needs_clarification": False, "current_stage": 1}

    payload = {
        "id": "cp-clarify-1",
        "stageId": 1,
        "type": "clarification",
        "title": "Human-in-the-Loop: Ambiguity Resolution Needed",
        "description": "The hiring request is too broad to run a reliable job-board search.",
        "timestamp": datetime.now().strftime("%H:%M:%S"),
        "clarificationQuestions": state.get("clarification_questions") or [],
    }
    answers = interrupt(payload)
    if isinstance(answers, dict) and "answers" in answers and isinstance(answers["answers"], dict):
        answers = answers["answers"]
    request = dict(state.get("request") or {})
    if isinstance(answers, dict):
        if answers.get("role"):
            request["role"] = answers["role"]
        if answers.get("location"):
            request["location"] = answers["location"]
        # GIS-style {questionId: answer}
        for qid, value in answers.items():
            if qid in ("role", "location", "type"):
                continue
            blob = str(value).lower()
            if "bangalore" in blob or "austin" in blob or "dallas" in blob or "remote" in blob:
                request["location"] = str(value)
            if any(k in blob for k in ("engineer", "analyst", "data", "ml", "devops", "full stack")):
                request["role"] = str(value)
    return {
        "clarification_answers": answers if isinstance(answers, dict) else {"response": answers},
        "needs_clarification": False,
        "request": request,
        "current_stage": 1,
        "logs": [_log(1, f"Clarification received. Resuming thread {state.get('thread_id')}.", "agent")],
    }
