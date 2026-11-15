"""Deterministic demand / recency stats from posting created timestamps."""

from __future__ import annotations

from collections import Counter
from datetime import datetime, timedelta, timezone
from typing import Optional


def parse_created(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None


def volume_timeline(postings: list[dict], now: Optional[datetime] = None) -> list[dict]:
    now = now or datetime.now(timezone.utc)
    months: Counter[str] = Counter()
    for p in postings:
        dt = parse_created(p.get("created"))
        if not dt:
            continue
        key = dt.strftime("%b")
        months[key] += 1
    if not months:
        return []
    # last 6 calendar months, oldest first
    points = []
    cursor = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
    seq = []
    for _ in range(6):
        seq.append(cursor)
        if cursor.month == 1:
            cursor = datetime(cursor.year - 1, 12, 1, tzinfo=timezone.utc)
        else:
            cursor = datetime(cursor.year, cursor.month - 1, 1, tzinfo=timezone.utc)
    seq.reverse()
    for dt in seq:
        label = dt.strftime("%b")
        points.append({"month": label, "volume": months.get(label, 0)})
    return points


def trend_30_day(postings: list[dict], now: Optional[datetime] = None) -> float:
    now = now or datetime.now(timezone.utc)
    recent = 0
    previous = 0
    for p in postings:
        dt = parse_created(p.get("created"))
        if not dt:
            continue
        age = (now - dt).days
        if 0 <= age <= 15:
            recent += 1
        elif 16 <= age <= 30:
            previous += 1
    if previous == 0:
        return 0.0 if recent == 0 else 100.0
    return round((recent - previous) / previous * 100, 1)


def average_age_days(postings: list[dict], now: Optional[datetime] = None) -> float:
    now = now or datetime.now(timezone.utc)
    ages = []
    for p in postings:
        dt = parse_created(p.get("created"))
        if dt:
            ages.append(max(0, (now - dt).days))
    return round(sum(ages) / len(ages), 1) if ages else 0.0
