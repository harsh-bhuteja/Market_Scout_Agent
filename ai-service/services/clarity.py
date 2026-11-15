"""Intake clarity assessment.

Uses deterministic heuristics always. When an LLM client is provided and enabled,
it may add extra targeted questions but cannot skip a heuristic pause.
"""

from __future__ import annotations

from typing import Optional

GENERIC_ROLES = {
    "engineer",
    "developer",
    "manager",
    "analyst",
    "specialist",
    "consultant",
    "associate",
    "lead",
    "officer",
    "intern",
    "executive",
    "programmer",
    "architect",
    "scientist",
}

BROAD_LOCATIONS = {
    "texas",
    "california",
    "florida",
    "india",
    "usa",
    "us",
    "uk",
    "united states",
    "united kingdom",
    "europe",
    "asia",
    "remote",
    "worldwide",
    "global",
    "anywhere",
    "canada",
    "australia",
    "germany",
    "new york",
}

METRO_HINTS = {
    "city",
    "metro",
    "bangalore",
    "bengaluru",
    "mumbai",
    "hyderabad",
    "delhi",
    "pune",
    "chennai",
    "austin",
    "dallas",
    "houston",
    "seattle",
    "london",
    "san francisco",
    "sf",
    "nyc",
    "chicago",
    "toronto",
    "berlin",
}


def assess_clarity(role: str, location: str, llm=None) -> dict:
    role_clean = (role or "").strip()
    location_clean = (location or "").strip()
    questions: list[dict] = []

    role_tokens = [t for t in role_clean.lower().replace("/", " ").replace("-", " ").split() if t]
    role_is_generic = (
        not role_clean
        or len(role_tokens) == 0
        or (len(role_tokens) == 1 and role_tokens[0] in GENERIC_ROLES)
        or role_clean.lower() in GENERIC_ROLES
    )

    location_norm = location_clean.lower().strip()
    has_metro = any(h in location_norm for h in METRO_HINTS) or "," in location_clean
    location_is_broad = (
        not location_clean
        or location_norm in BROAD_LOCATIONS
        or (not has_metro and location_norm in BROAD_LOCATIONS)
        or (len(location_clean.split()) == 1 and location_norm in BROAD_LOCATIONS)
    )

    if role_is_generic:
        questions.append(
            {
                "id": "q1",
                "question": "Which specific role or engineering/professional track should this scout prioritize?",
                "context": "A generic title covers multiple markets with different salary bands and skills.",
                "suggestedAnswers": [
                    "Backend Software Engineering (Distributed Systems)",
                    "Machine Learning / AI Engineering",
                    "Data Analyst / Analytics",
                    "DevOps & Cloud Infrastructure",
                    "Full Stack Web Engineering",
                ],
            }
        )

    if location_is_broad:
        questions.append(
            {
                "id": "q2",
                "question": "Confirm the target geography and work mode:",
                "context": "Broad regions span multiple talent markets and commuting patterns.",
                "suggestedAnswers": [
                    "Specific metro (Hybrid / On-site within 35 miles)",
                    "State-wide or country-wide remote",
                    "Nationwide remote",
                ],
            }
        )

    if not questions and (len(role_clean) < 3 or len(location_clean) < 2):
        questions.append(
            {
                "id": "q1",
                "question": "Please provide a more specific job title and city or metro.",
                "context": "The current request is too short to plan a reliable job-board search.",
                "suggestedAnswers": ["Data Analyst in Bangalore", "Software Engineer in Austin, TX"],
            }
        )

    extra = _llm_questions(role_clean, location_clean, llm) if llm is not None else []
    existing_ids = {q["id"] for q in questions}
    for q in extra:
        if q.get("id") in existing_ids:
            continue
        questions.append(q)
        if len(questions) >= 3:
            break

    return {
        "needs_clarification": bool(questions),
        "questions": questions[:3],
        "role_is_generic": role_is_generic,
        "location_is_broad": location_is_broad,
    }


def _llm_questions(role: str, location: str, llm) -> list[dict]:
    if not getattr(llm, "enabled", False):
        return []
    try:
        from pydantic import BaseModel, Field

        class Q(BaseModel):
            id: str
            question: str
            context: str = ""
            suggestedAnswers: list[str] = Field(default_factory=list)

        class Out(BaseModel):
            questions: list[Q] = Field(default_factory=list)

        parsed = llm.complete_json(
            "If the hiring request is ambiguous, return 0-2 extra clarification questions as JSON. "
            "Do not ask questions when title and metro/city are already specific.",
            f"role={role}; location={location}",
            Out,
        )
        return [q.model_dump() for q in parsed.questions][:2]
    except Exception:
        return []
