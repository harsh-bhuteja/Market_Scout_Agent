from __future__ import annotations

from collections import Counter
from datetime import datetime, timezone

from services.compensation import summarize_compensation
from services.skills import skill_frequencies


def _log(stage: int, text: str, level: str = "agent") -> dict:
    return {
        "timestamp": datetime.now().strftime("%H:%M:%S"),
        "stageId": stage,
        "text": text,
        "level": level,
    }


def synthesize_node(state: dict) -> dict:
    postings = state.get("postings") or []
    analyses = state.get("batch_analyses") or []
    request = state.get("request") or {}
    currency = request.get("currency") or "USD"
    rates = state.get("rates_to_usd") or {"USD": 1.0, "EUR": 0.92, "GBP": 0.79, "INR": 83.0}

    compensation = summarize_compensation(postings, currency, rates)
    n = max(len(postings), 1)
    must_have, nice_to_have = skill_frequencies(analyses, len(postings))

    employers = Counter()
    employer_type = {}
    titles = Counter()
    seniority = Counter()
    analysis_by_id = {a.get("posting_id"): a for a in analyses}

    ages = []
    now = datetime.now(timezone.utc)
    for p in postings:
        company = p.get("company") or "Unknown"
        employers[company] += 1
        a = analysis_by_id.get(p.get("id")) or {}
        employer_type[company] = a.get("employer_type") or "Direct"
        titles[p.get("title") or "Unknown"] += 1
        seniority[a.get("seniority_guess") or "Unknown"] += 1
        created = p.get("created")
        if created:
            try:
                dt = datetime.fromisoformat(str(created).replace("Z", "+00:00"))
                ages.append(max(0, (now - dt).days))
            except ValueError:
                pass

    top_employers = []
    for name, count in employers.most_common(8):
        top_employers.append(
            {
                "name": name,
                "openPositions": count,
                "marketSharePercent": round(count / n * 100),
                "type": employer_type.get(name, "Direct"),
            }
        )
    direct = sum(1 for p in postings if (analysis_by_id.get(p.get("id")) or {}).get("employer_type") != "Staffing")
    agency = len(postings) - direct
    observed = [
        {"title": t, "count": c, "sharePercent": round(c / n * 100)}
        for t, c in titles.most_common(8)
    ]
    exp_dist = []
    sen_total = sum(seniority.values()) or 1
    mapping = {
        "Junior": "0-2 years",
        "Mid-Level": "3-5 years",
        "Senior": "6-8 years",
        "Staff/Lead": "8+ years",
        "Director": "8+ years",
        "Unknown": "Unspecified",
    }
    brackets = Counter()
    for k, v in seniority.items():
        brackets[mapping.get(k, "Unspecified")] += v
    for label, count in brackets.most_common():
        exp_dist.append({"bracket": label, "percentage": round(count / sen_total * 100)})

    from services.compensation import compute_seniority_breakdown
    compensation["seniorityBreakdown"] = compute_seniority_breakdown(
        postings, analyses, currency, rates
    )

    avg_age = round(sum(ages) / len(ages), 1) if ages else 0
    stats = {
        "compensation": compensation,
        "mustHaveSkills": must_have,
        "niceToHaveSkills": nice_to_have,
        "topEmployers": top_employers,
        "agencyVsDirect": {
            "directPercent": round(direct / n * 100),
            "agencyPercent": round(agency / n * 100),
        },
        "observedTitles": observed,
        "experienceDistribution": exp_dist,
        "typicalYearsExperience": _typical_years(seniority),
        "averagePostingAgeDays": avg_age,
        "totalPostings": len(postings),
        "validPostingIds": [p.get("id") for p in postings if p.get("id")],
    }
    return {
        "stats": stats,
        "current_stage": 5,
        "logs": [
            _log(5, "Computing median and IQR from disclosed salaries only.", "agent"),
            _log(5, "Aggregating skills, employers, and title variants from posting IDs.", "success"),
        ],
    }


def _typical_years(seniority: Counter) -> float:
    weights = {"Junior": 1.5, "Mid-Level": 4.0, "Senior": 7.0, "Staff/Lead": 10.0, "Director": 12.0}
    total = 0.0
    n = 0
    for k, v in seniority.items():
        if k in weights:
            total += weights[k] * v
            n += v
    return round(total / n, 1) if n else 0.0
