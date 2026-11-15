"""Map free-text locations to Adzuna country codes."""

from __future__ import annotations

COUNTRY_HINTS = [
    (("india", "bangalore", "bengaluru", "mumbai", "hyderabad", "delhi", "pune", "chennai", "gurgaon", "noida", "karnataka"), "in"),
    (("united kingdom", "uk", "england", "london", "manchester", "scotland"), "gb"),
    (("canada", "toronto", "vancouver", "montreal"), "ca"),
    (("germany", "berlin", "munich"), "de"),
    (("france", "paris"), "fr"),
    (("australia", "sydney", "melbourne"), "au"),
    (("netherlands", "amsterdam"), "nl"),
    (("singapore",), "sg"),
    (("united states", "usa", "us", "texas", "austin", "california", "san francisco", "new york", "seattle", "chicago"), "us"),
]


def infer_country(location: str, default: str = "us") -> str:
    blob = (location or "").lower()
    for hints, code in COUNTRY_HINTS:
        if any(h in blob for h in hints):
            return code
    return default
