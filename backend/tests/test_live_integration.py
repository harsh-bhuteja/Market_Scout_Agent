"""Live Adzuna + LLM integration. Skipped unless credentials are present.

Run:  pytest backend/tests/test_live_integration.py -m live
"""

from __future__ import annotations

import os
from pathlib import Path

import pytest

pytestmark = pytest.mark.live

ROOT = Path(__file__).resolve().parents[2]


def _configured() -> bool:
    app_id = os.getenv("ADZUNA_APP_ID", "")
    app_key = os.getenv("ADZUNA_APP_KEY", "")
    return bool(app_id and app_key and "your-" not in app_id)


@pytest.mark.skipif(not _configured(), reason="Adzuna credentials not configured")
def test_live_adzuna_search_parses():
    import sys

    sys.path.insert(0, str(ROOT / "ai-service"))
    from tools.adzuna import AdzunaClient

    client = AdzunaClient(os.environ["ADZUNA_APP_ID"], os.environ["ADZUNA_APP_KEY"], max_retries=1)
    payload = client.search(query="Data Analyst", location="London", country="gb", page=1, results_per_page=5)
    assert payload["results"]
    posting = payload["results"][0]
    assert posting["source"] == "adzuna"
    assert posting["source_id"]
    assert "raw" in posting
