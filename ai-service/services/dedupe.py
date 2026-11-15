from __future__ import annotations

import hashlib
import re


def _norm(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", (value or "").lower()).strip()


def posting_fingerprint(posting: dict) -> str:
    source_id = str(posting.get("source_id") or posting.get("id") or "")
    if source_id:
        return f"src:{source_id}"
    key = "|".join(
        [
            _norm(posting.get("title", "")),
            _norm(posting.get("company", "")),
            _norm(posting.get("location", "")),
        ]
    )
    return "fp:" + hashlib.sha256(key.encode("utf-8")).hexdigest()[:16]


def deduplicate(postings: list[dict]) -> tuple[list[dict], int]:
    seen: set[str] = set()
    unique: list[dict] = []
    dupes = 0
    for p in postings:
        fp = posting_fingerprint(p)
        if fp in seen:
            dupes += 1
            continue
        seen.add(fp)
        unique.append(p)
    return unique, dupes
