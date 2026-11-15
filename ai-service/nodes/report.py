from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, Field

from schemas.report import ConfidenceInsight, MarketBrief
from services.llm import LLMClient, LLMError
from services.markdown import brief_to_markdown


class Narrative(BaseModel):
    summary: str
    outlook_reason: str
    job_description_hook: str
    strategic_takeaway: str
    suggested_job_title: str
    salary_rationale: str
    insights: list[str] = Field(default_factory=list)


def _log(stage: int, text: str, level: str = "agent") -> dict:
    return {
        "timestamp": datetime.now().strftime("%H:%M:%S"),
        "stageId": stage,
        "text": text,
        "level": level,
    }


def _outlook(stats: dict, confidence_floor: str) -> str:
    n = stats.get("totalPostings") or 0
    disclosure = (stats.get("compensation") or {}).get("disclosedPayPercentage") or 0
    if confidence_floor == "Low" or n < 15:
        return "Hard to fill"
    if n > 120:
        return "Competitive"
    if 20 <= n <= 120 and disclosure >= 20:
        return "Favourable"
    if n >= 40:
        return "Competitive"
    return "Hard to fill"


def _confidence(n: int, evidence: int, floor: str) -> tuple[str, int]:
    if floor == "Low":
        return "Low", min(55, 30 + evidence)
    pct = evidence / n * 100 if n else 0
    if evidence >= 50 and pct >= 30:
        return "High", min(96, 70 + int(pct / 5))
    if evidence >= 15:
        return "Medium", min(82, 55 + evidence)
    return "Low", max(20, evidence)


def _valid_ids(ids: list[str], allowed: set[str], limit: int = 5) -> list[str]:
    out = []
    for i in ids:
        if i in allowed and i not in out:
            out.append(i)
        if len(out) >= limit:
            break
    if len(out) < min(limit, len(allowed)):
        for i in list(allowed):
            if i not in out:
                out.append(i)
            if len(out) >= limit:
                break
    return out


def report_node(state: dict, llm: Optional[LLMClient] = None) -> dict:
    request = state.get("request") or {}
    stats = state.get("stats") or {}
    plan = state.get("search_plan") or {}
    allowed = set(stats.get("validPostingIds") or [])
    n = stats.get("totalPostings") or 0
    floor = state.get("confidence_floor") or ""
    verdict = _outlook(stats, floor)
    comp = stats.get("compensation") or {}
    thread_id = state.get("thread_id") or "run"
    generated_at = datetime.now(timezone.utc).isoformat()

    narrative = None
    if llm and llm.enabled:
        try:
            narrative = llm.complete_json(
                "Write qualitative market commentary. Do not invent statistics, employers, or posting IDs. "
                "Use only the provided numbers. Keep summary to 2-3 sentences.",
                f"Role={request.get('role')} Location={request.get('location')} Stats={ {k: stats[k] for k in stats if k != 'validPostingIds'} } Verdict={verdict}",
                Narrative,
            )
        except LLMError:
            narrative = None

    salary_ids = _valid_ids(allowed, allowed, 5)
    skill_ids = salary_ids[:4]
    conf_comp, score_comp = _confidence(n, comp.get("sampleSize") or 0, floor)
    must = stats.get("mustHaveSkills") or []

    started_at = state.get("started_at")
    exec_seconds = 0.0
    if started_at:
        try:
            t0 = datetime.fromisoformat(str(started_at).replace("Z", "+00:00"))
            t1 = datetime.fromisoformat(str(generated_at).replace("Z", "+00:00"))
            exec_seconds = round(max(0.1, (t1 - t0).total_seconds()), 2)
        except Exception:
            exec_seconds = 0.0
    skill_n = must[0]["frequency"] if must else 0
    conf_skill, score_skill = _confidence(n, skill_n, floor)
    conf_demand, score_demand = _confidence(n, n, floor)

    summary = (
        narrative.summary
        if narrative
        else (
            f"The {request.get('location')} market for {request.get('role')} shows {n} unique postings in the analysed sample. "
            f"Disclosed pay median is {comp.get('medianSalary')} {comp.get('currency')} with an IQR of "
            f"{comp.get('percentile25')}–{comp.get('percentile75')}. "
            f"Hiring outlook is {verdict.lower()} based on volume and evidence quality."
        )
    )

    insights = [
        ConfidenceInsight(
            id="conf-comp",
            category="Compensation",
            claim=(
                f"Median disclosed compensation is {comp.get('medianSalary')} {comp.get('currency')} "
                f"(IQR {comp.get('percentile25')}–{comp.get('percentile75')})."
            ),
            confidence=conf_comp,  # type: ignore[arg-type]
            confidenceScore=score_comp,
            confidenceRationale="Computed from disclosed, normalized salaries only; missing and predicted values excluded.",
            evidencePostingCount=int(comp.get("sampleSize") or 0),
            evidencePercentage=float(comp.get("disclosedPayPercentage") or 0),
            samplePostingIds=salary_ids,
        ),
        ConfidenceInsight(
            id="conf-skills",
            category="Skills",
            claim=(
                f"{must[0]['name']} appears in {must[0]['percentage']}% of analysed postings."
                if must
                else "Skill frequencies were derived only from extracted posting text."
            ),
            confidence=conf_skill,  # type: ignore[arg-type]
            confidenceScore=score_skill,
            confidenceRationale="Skill mentions counted from posting titles/descriptions after alias normalization.",
            evidencePostingCount=int(skill_n),
            evidencePercentage=float(must[0]["percentage"] if must else 0),
            samplePostingIds=skill_ids,
        ),
        ConfidenceInsight(
            id="conf-demand",
            category="Demand",
            claim=f"{n} unique relevant postings were analysed after deduplication.",
            confidence=conf_demand,  # type: ignore[arg-type]
            confidenceScore=score_demand,
            confidenceRationale="Count is the unique posting ID set remaining after source-id and fingerprint deduplication.",
            evidencePostingCount=int(n),
            evidencePercentage=100.0 if n else 0.0,
            samplePostingIds=_valid_ids(list(allowed), allowed, 4),
        ),
    ]

    target = int(comp.get("medianSalary") or 0)
    rec_min = int(comp.get("percentile25") or 0)
    rec_max = int(comp.get("percentile75") or 0)
    brief = MarketBrief(
        id=f"brief-{thread_id}",
        requestId=thread_id,
        role=request.get("role") or "",
        location=request.get("location") or "",
        generatedAt=generated_at,
        summary=summary,
        hiringOutlook={
            "verdict": verdict,
            "reason": narrative.outlook_reason if narrative else f"Based on {n} unique postings and {comp.get('disclosedPayPercentage')}% salary disclosure.",
            "metricSummary": f"{n} unique postings · median {comp.get('medianSalary')} {comp.get('currency')} · disclosure {comp.get('disclosedPayPercentage')}%",
        },
        demandVolume={
            "totalActivePostings": n,
            "sampleAnalyzed": n,
            "trend30Day": 0,
            "averagePostingAgeDays": stats.get("averagePostingAgeDays") or 0,
            "volumeTimeline": [],
        },
        compensation={
            "currency": comp.get("currency"),
            "medianSalary": int(comp.get("medianSalary") or 0),
            "percentile25": int(comp.get("percentile25") or 0),
            "percentile75": int(comp.get("percentile75") or 0),
            "salaryMin": int(comp.get("salaryMin") or 0),
            "salaryMax": int(comp.get("salaryMax") or 0),
            "disclosedPayPercentage": float(comp.get("disclosedPayPercentage") or 0),
            "distributionBands": comp.get("distributionBands") or [],
            "seniorityBreakdown": [
                {
                    "level": row.get("level"),
                    "median": row.get("median") or 0,
                    "min": row.get("min") or 0,
                    "max": row.get("max") or 0,
                    "count": row.get("count") or 0,
                    "disclosedCount": row.get("disclosedCount") or 0,
                    "status": row.get("status") or ("sufficient" if (row.get("median") or 0) > 0 else "insufficient_data"),
                }
                for row in comp.get("seniorityBreakdown") or []
            ],
        },
        skillsAndRequirements={
            "mustHaveSkills": must,
            "niceToHaveSkills": stats.get("niceToHaveSkills") or [],
            "typicalYearsExperience": stats.get("typicalYearsExperience") or 0,
            "experienceDistribution": stats.get("experienceDistribution") or [],
        },
        employerCompetition={
            "topEmployers": stats.get("topEmployers") or [],
            "agencyVsDirect": stats.get("agencyVsDirect") or {"directPercent": 0, "agencyPercent": 0},
        },
        observedTitles=stats.get("observedTitles") or [],
        confidenceInsights=insights,
        clientRecommendations={
            "suggestedJobTitle": narrative.suggested_job_title if narrative else (request.get("role") or ""),
            "recommendedSalaryBand": {
                "min": rec_min,
                "max": rec_max,
                "target": target,
                "currency": comp.get("currency") or request.get("currency") or "USD",
                "rationale": narrative.salary_rationale
                if narrative
                else "Target is the disclosed median; band is the IQR of normalized annual pay.",
            },
            "leadSkills": [s["name"] for s in must[:4]],
            "jobDescriptionHook": narrative.job_description_hook
            if narrative
            else f"Hire a {request.get('role')} focused on {', '.join(s['name'] for s in must[:3]) or 'core role skills'}.",
            "strategicTakeaway": narrative.strategic_takeaway
            if narrative
            else "Lead the requisition with the highest-frequency must-have skills and a median-aligned salary band.",
        },
        runNotes={
            "questionsAndAnswers": _qa(state),
            "finalSearchPlan": plan,
            "postingsFetched": int(state.get("postings_fetched_raw") or n),
            "postingsDeduplicated": n,
            "postingsAnalyzed": n,
            "dedupedDuplicatesCount": int(state.get("duplicates_removed") or 0),
            "executionTimeSeconds": exec_seconds,
            "assumptionsMade": (comp.get("notes") or [])
            + [
                "Missing salaries are excluded, never imputed.",
                "Currency conversion uses configured USD cross rates only.",
                "Predicted Adzuna salaries are excluded.",
            ],
            "dataSource": "Adzuna Jobs API",
        },
    )
    payload = brief.model_dump()
    return {
        "report": payload,
        "report_markdown": brief_to_markdown(payload),
        "current_stage": 6,
        "status": "completed",
        "finished_at": generated_at,
        "logs": [_log(6, "Structured market brief validated against Pydantic schema.", "success")],
    }


def _qa(state: dict) -> list[dict]:
    answers = state.get("clarification_answers") or {}
    questions = {q.get("id"): q.get("question") for q in state.get("clarification_questions") or []}
    out = []
    if isinstance(answers, dict):
        for k, v in answers.items():
            if k in ("type", "plan", "action"):
                continue
            out.append({"question": questions.get(k, k), "answer": str(v)})
    return out
