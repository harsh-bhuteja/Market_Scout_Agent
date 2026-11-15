from __future__ import annotations

from unittest.mock import patch

import httpx
from fastapi.testclient import TestClient

from app.engine import reset_runner
from graph.runner import ResearchGraphRunner
from tools.adzuna import AdzunaClient


def _jobs(n):
    results = []
    for i in range(n):
        results.append(
            {
                "id": 5000 + i,
                "title": "Data Analyst",
                "description": "SQL Python Tableau",
                "created": "2026-10-01T00:00:00Z",
                "company": {"display_name": "Globex"},
                "location": {"display_name": "Bangalore"},
                "salary_min": 1000000,
                "salary_max": 1400000,
                "salary_currency": "INR",
            }
        )
    return results


def _handler(request: httpx.Request) -> httpx.Response:
    return httpx.Response(200, json={"count": 25, "results": _jobs(25)})


def _auth(client: TestClient):
    fake = {"id": "op-1", "email": "op@example.com", "name": "Op", "picture": "", "email_verified": True}
    with patch("app.auth.router.verify_google_credential", return_value=fake):
        client.post("/api/auth/google", json={"credential": "header.payload.sig"})


def test_frontend_integration_start_pause_resume_report(client: TestClient, tmp_path):
    adzuna = AdzunaClient("id", "key", transport=httpx.MockTransport(_handler))
    runner = ResearchGraphRunner(
        checkpoint_path=str(tmp_path / "ck.db"),
        adzuna=adzuna,
        llm=None,
        min_postings=5,
        max_fetch_attempts=1,
        batch_size=40,
    )
    reset_runner(runner)
    _auth(client)
    started = client.post("/api/research", json={"role": "Data Analyst", "location": "Bangalore", "currency": "INR"})
    assert started.status_code == 200
    run_id = started.json()["runId"]
    body = started.json()["run"]
    assert body["status"] == "paused"
    assert body["checkpoint"]["type"] == "search_plan_approval"

    listed = client.get("/api/research")
    assert listed.status_code == 200
    assert any(r["id"] == run_id for r in listed.json())

    current = client.get(f"/api/research/{run_id}")
    assert current.status_code == 200

    resumed = client.post(
        f"/api/research/{run_id}/resume",
        json={"plan": body["checkpoint"]["searchPlanDraft"]},
    )
    assert resumed.status_code == 200
    assert resumed.json()["status"] == "completed"

    report = client.get(f"/api/research/{run_id}/report")
    assert report.status_code == 200
    assert report.json()["role"] == "Data Analyst"
    events = client.get(f"/api/research/{run_id}/events")
    assert events.status_code == 200
    reset_runner(None)
