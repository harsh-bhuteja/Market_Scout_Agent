"""Deterministic compensation statistics. Never invents missing salaries."""

from __future__ import annotations

from statistics import median
from typing import Optional

PERIOD_MULTIPLIERS = {
    "year": 1.0,
    "annual": 1.0,
    "annum": 1.0,
    "yearly": 1.0,
    "lpa": 100000.0,
    "lakh": 100000.0,
    "lakhs": 100000.0,
    "month": 12.0,
    "monthly": 12.0,
    "week": 52.0,
    "weekly": 52.0,
    "day": 260.0,
    "daily": 260.0,
    "hour": 2080.0,
    "hourly": 2080.0,
}


def percentile(sorted_vals: list[float], p: float) -> float:
    if not sorted_vals:
        raise ValueError("Cannot compute percentile of empty list")
    if len(sorted_vals) == 1:
        return sorted_vals[0]
    try:
        import numpy as np

        return float(np.percentile(sorted_vals, p * 100, method="weibull"))
    except Exception:
        n = len(sorted_vals)
        k = max(0.0, min(float(n - 1), p * (n + 1) - 1))
        f = int(k)
        c = min(f + 1, n - 1)
        if f == c:
            return float(sorted_vals[f])
        return float(sorted_vals[f] + (sorted_vals[c] - sorted_vals[f]) * (k - f))


def convert_currency(amount: float, source: str, target: str, rates_to_usd: dict[str, float]) -> Optional[float]:
    src = (source or target).upper()
    tgt = target.upper()
    if src == tgt:
        return amount
    if src not in rates_to_usd or tgt not in rates_to_usd:
        return None
    usd = amount / rates_to_usd[src] if src != "USD" else amount
    if tgt == "USD":
        return usd
    return usd * rates_to_usd[tgt]


def annualize(amount: float, period: Optional[str]) -> Optional[float]:
    if amount is None:
        return None
    if not period:
        return amount
    key = period.lower().strip()
    multiplier = PERIOD_MULTIPLIERS.get(key)
    if multiplier is None:
        return None
    return amount * multiplier


def extract_salary_points(
    postings: list[dict],
    target_currency: str,
    rates_to_usd: dict[str, float],
) -> tuple[list[float], int, list[str]]:
    """Return (normalized annual salaries, disclosed count, skip reasons)."""
    values: list[float] = []
    disclosed = 0
    notes: list[str] = []
    for p in postings:
        raw_min = p.get("salary_min")
        raw_max = p.get("salary_max")
        if p.get("salary_is_predicted"):
            notes.append(f"{p.get('id')}: excluded predicted salary")
            continue
        if raw_min is None and raw_max is None:
            continue
        val_min = float(raw_min) if raw_min is not None else None
        val_max = float(raw_max) if raw_max is not None else None
        if (val_min is None or val_min <= 0) and (val_max is None or val_max <= 0):
            notes.append(f"{p.get('id')}: non-positive salary values — excluded")
            continue
        disclosed += 1
        period = p.get("salary_period") or p.get("contract_time") or "year"
        if period in ("full_time", "part_time", "permanent", "contract"):
            period = "year"
        currency = (p.get("currency") or target_currency or "USD").upper()
        # In India / INR, salaries are commonly quoted in Lakhs Per Annum (LPA, 1 Lakh = 100,000 INR).
        # If the pay period is already 'lpa'/'lakh', annualize() handles the multiplier.
        # Otherwise, if raw values in INR are in LPA units (e.g. 6 meaning 6 LPA = 600,000 INR),
        # normalize to standard annual INR.
        if currency == "INR" and period.lower() not in ("lpa", "lakh", "lakhs"):
            if val_min is not None and 0 < val_min < 1000.0:
                val_min = val_min * 100000.0
            if val_max is not None and 0 < val_max < 1000.0:
                val_max = val_max * 100000.0
        if val_min is None or val_min <= 0:
            mid = float(val_max)  # type: ignore[arg-type]
        elif val_max is None or val_max <= 0:
            mid = float(val_min)
        else:
            mid = (val_min + val_max) / 2.0
        annual = annualize(mid, period)
        if annual is None:
            notes.append(f"{p.get('id')}: unknown pay period '{period}' — excluded")
            continue
        currency = (p.get("currency") or target_currency or "USD").upper()
        converted = convert_currency(annual, currency, target_currency, rates_to_usd)
        if converted is None:
            notes.append(f"{p.get('id')}: no conversion rate {currency}->{target_currency} — excluded")
            continue
        values.append(converted)
    return values, disclosed, notes


def trim_outliers_iqr(values: list[float]) -> list[float]:
    if len(values) < 4:
        return list(values)
    ordered = sorted(values)
    q1 = percentile(ordered, 0.25)
    q3 = percentile(ordered, 0.75)
    iqr = q3 - q1
    if iqr <= 0:
        return ordered
    low, high = q1 - 1.5 * iqr, q3 + 1.5 * iqr
    return [v for v in ordered if low <= v <= high]


def summarize_compensation(
    postings: list[dict],
    target_currency: str,
    rates_to_usd: dict[str, float],
) -> dict:
    n = len(postings)
    values, disclosed, notes = extract_salary_points(postings, target_currency, rates_to_usd)
    cleaned = trim_outliers_iqr(values)
    disclosure_rate = (disclosed / n * 100) if n else 0.0
    if not cleaned:
        return {
            "currency": target_currency,
            "medianSalary": 0,
            "percentile25": 0,
            "percentile75": 0,
            "salaryMin": 0,
            "salaryMax": 0,
            "disclosedPayPercentage": round(disclosure_rate, 1),
            "sampleSize": 0,
            "disclosedCount": disclosed,
            "distributionBands": [],
            "seniorityBreakdown": [],
            "notes": notes + ["No usable disclosed salaries after normalization."],
        }
    ordered = sorted(cleaned)
    p25 = percentile(ordered, 0.25)
    p75 = percentile(ordered, 0.75)
    bands = _bands(ordered, target_currency)
    return {
        "currency": target_currency,
        "medianSalary": round(median(ordered)),
        "percentile25": round(p25),
        "percentile75": round(p75),
        "salaryMin": round(ordered[0]),
        "salaryMax": round(ordered[-1]),
        "disclosedPayPercentage": round(disclosure_rate, 1),
        "sampleSize": len(ordered),
        "disclosedCount": disclosed,
        "distributionBands": bands,
        "seniorityBreakdown": [],
        "notes": notes,
    }


def _bands(ordered: list[float], currency: str) -> list[dict]:
    if not ordered:
        return []
    lo, hi = ordered[0], ordered[-1]
    if lo == hi:
        return [{"band": _fmt_band(lo, hi, currency), "count": len(ordered), "percentage": 100}]
    step = (hi - lo) / 4
    edges = [lo + step * i for i in range(5)]
    counts = [0] * 4
    for v in ordered:
        idx = min(3, int((v - lo) / step) if step else 0)
        counts[idx] += 1
    out = []
    total = len(ordered)
    for i, count in enumerate(counts):
        start, end = edges[i], edges[i + 1]
        out.append(
            {
                "band": _fmt_band(start, end, currency),
                "count": count,
                "percentage": round(count / total * 100),
            }
        )
    return out


def _fmt_band(a: float, b: float, currency: str) -> str:
    if currency == "INR":
        return f"₹{round(a/100000, 1)}L - ₹{round(b/100000, 1)}L"
    symbol = {"USD": "$", "EUR": "€", "GBP": "£"}.get(currency, "")
    return f"{symbol}{round(a):,} - {symbol}{round(b):,}"


def compute_seniority_breakdown(
    postings: list[dict],
    analyses: list[dict],
    target_currency: str,
    rates_to_usd: dict[str, float],
) -> list[dict]:
    analysis_by_id = {a.get("posting_id"): a for a in analyses}
    standard_levels = ["Junior", "Mid-Level", "Senior", "Staff/Lead", "Director", "Unknown"]

    level_salaries: dict[str, list[float]] = {lvl: [] for lvl in standard_levels}
    level_counts: dict[str, int] = {lvl: 0 for lvl in standard_levels}

    for p in postings:
        pid = p.get("id")
        a = analysis_by_id.get(pid) or {}
        level = a.get("seniority_guess") or "Unknown"
        if level not in level_salaries:
            level_salaries[level] = []
            level_counts[level] = 0
        level_counts[level] += 1

        raw_min = p.get("salary_min")
        raw_max = p.get("salary_max")
        if p.get("salary_is_predicted"):
            continue
        if raw_min is None and raw_max is None:
            continue
        val_min = float(raw_min) if raw_min is not None else None
        val_max = float(raw_max) if raw_max is not None else None
        if (val_min is None or val_min <= 0) and (val_max is None or val_max <= 0):
            continue

        period = p.get("salary_period") or p.get("contract_time") or "year"
        if period in ("full_time", "part_time", "permanent", "contract"):
            period = "year"
        currency = (p.get("currency") or target_currency or "USD").upper()
        if currency == "INR" and period.lower() not in ("lpa", "lakh", "lakhs"):
            if val_min is not None and 0 < val_min < 1000.0:
                val_min = val_min * 100000.0
            if val_max is not None and 0 < val_max < 1000.0:
                val_max = val_max * 100000.0
        if val_min is None or val_min <= 0:
            mid = float(val_max)
        elif val_max is None or val_max <= 0:
            mid = float(val_min)
        else:
            mid = (val_min + val_max) / 2.0

        annual = annualize(mid, period)
        if annual is None:
            continue
        converted = convert_currency(annual, currency, target_currency, rates_to_usd)
        if converted is None:
            continue
        level_salaries[level].append(converted)

    breakdown = []
    ordered_keys = [lvl for lvl in standard_levels if level_counts.get(lvl, 0) > 0 or len(level_salaries.get(lvl, [])) > 0]
    for lvl in level_counts:
        if lvl not in ordered_keys and (level_counts[lvl] > 0 or len(level_salaries[lvl]) > 0):
            ordered_keys.append(lvl)

    for lvl in ordered_keys:
        sals = level_salaries.get(lvl, [])
        total_p = level_counts.get(lvl, 0)
        disclosed_n = len(sals)
        if sals:
            s_sorted = sorted(sals)
            breakdown.append({
                "level": lvl,
                "median": round(median(s_sorted)),
                "min": round(s_sorted[0]),
                "max": round(s_sorted[-1]),
                "count": total_p,
                "disclosedCount": disclosed_n,
                "status": "sufficient" if disclosed_n >= 3 else "low_sample",
            })
        else:
            breakdown.append({
                "level": lvl,
                "median": 0,
                "min": 0,
                "max": 0,
                "count": total_p,
                "disclosedCount": 0,
                "status": "insufficient_data",
            })
    return breakdown
