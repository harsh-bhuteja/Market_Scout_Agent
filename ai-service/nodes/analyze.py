from __future__ import annotations

from datetime import datetime

from langgraph.types import Send

from services.llm import LLMClient, LLMError
from services.skills import classify_employer, extract_skills_heuristic, normalize_skill


def _log(stage: int, text: str, level: str = "agent") -> dict:
    return {
        "timestamp": datetime.now().strftime("%H:%M:%S"),
        "stageId": stage,
        "text": text,
        "level": level,
    }


def plan_batches(state: dict) -> list[Send]:
    postings = state.get("postings") or []
    batch_size = int(state.get("batch_size") or 40)
    if not postings:
        return [Send("analyze_batch", {"batch": [], "use_llm": False})]
    sends = []
    for i in range(0, len(postings), batch_size):
        compact = []
        for p in postings[i : i + batch_size]:
            compact.append(
                {
                    "id": p.get("id"),
                    "title": p.get("title"),
                    "company": p.get("company"),
                    "location": p.get("location"),
                    "description": (p.get("description") or "")[:800],
                }
            )
        sends.append(Send("analyze_batch", {"batch": compact}))
    return sends


def analyze_batch(state: dict, llm: LLMClient | None = None) -> dict:
    batch = state.get("batch") or []
    analyses = []
    for posting in batch:
        text = f"{posting.get('title', '')} {posting.get('description', '')}"
        skills = [normalize_skill(s) for s in extract_skills_heuristic(text)]
        employer_type = classify_employer(posting.get("company") or "", posting.get("description") or "")
        title = posting.get("title") or ""
        seniority = "Unknown"
        lower = title.lower()
        if "junior" in lower or "associate" in lower:
            seniority = "Junior"
        elif "lead" in lower or "staff" in lower or "principal" in lower:
            seniority = "Staff/Lead"
        elif "senior" in lower or "sr." in lower:
            seniority = "Senior"
        elif "director" in lower:
            seniority = "Director"
        elif "mid" in lower:
            seniority = "Mid-Level"
        must = skills[: max(1, len(skills) // 2)]
        nice = skills[len(must) :]
        analyses.append(
            {
                "posting_id": posting.get("id"),
                "skills": skills,
                "must_have_skills": must,
                "nice_to_have_skills": nice,
                "seniority_guess": seniority,
                "years_experience": None,
                "employer_type": employer_type,
                "title_normalized": title,
            }
        )

    if llm and llm.enabled and batch:
        try:
            snippet = [
                {"id": p.get("id"), "title": p.get("title"), "description": (p.get("description") or "")[:400]}
                for p in batch[:40]
            ]
            raw = llm.complete(
                "Extract skills from job postings. Return JSON {items:[{posting_id,skills,must_have_skills,nice_to_have_skills,seniority_guess,employer_type}]}. "
                "Use only skills grounded in the text. Do not invent posting IDs.",
                str(snippet),
            )
            import json

            from services.llm import _extract_json

            parsed = _extract_json(raw)
            items = parsed.get("items") if isinstance(parsed, dict) else parsed
            by_id = {row["posting_id"]: row for row in analyses}
            for item in items or []:
                pid = item.get("posting_id")
                if pid in by_id:
                    merged = dict(by_id[pid])
                    for key in ("skills", "must_have_skills", "nice_to_have_skills", "seniority_guess", "employer_type"):
                        if item.get(key):
                            if key.endswith("skills"):
                                merged[key] = [normalize_skill(s) for s in item[key]]
                            else:
                                merged[key] = item[key]
                    by_id[pid] = merged
            analyses = list(by_id.values())
        except (LLMError, Exception):
            # Heuristic results already computed; keep them.
            pass

    return {
        "batch_analyses": analyses,
        "current_stage": 4,
        "logs": [_log(4, f"Analysed batch of {len(batch)} postings.", "agent")],
    }
