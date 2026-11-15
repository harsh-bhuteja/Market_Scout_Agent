from __future__ import annotations

import httpx
from graph.runner import ResearchGraphRunner
from tools.adzuna import AdzunaClient


def make_job(i: int, **overrides) -> dict:
    job = {
        "id": 1000 + i,
        "title": overrides.get("title", "Data Analyst"),
        "description": overrides.get(
            "description",
            "Looking for SQL, Python, Tableau and Power BI experience. dbt is a plus.",
        ),
        "created": "2026-10-01T00:00:00Z",
        "company": {"display_name": overrides.get("company", f"Acme {i % 5}")},
        "location": {"display_name": overrides.get("location", "Bangalore")},
        "salary_min": overrides.get("salary_min", 900000 + i * 1000),
        "salary_max": overrides.get("salary_max", 1400000 + i * 1000),
        "salary_is_predicted": overrides.get("salary_is_predicted", 0),
        "salary_currency": overrides.get("salary_currency", "INR"),
        "contract_time": overrides.get("contract_time", "full_time"),
        "redirect_url": f"https://example.test/jobs/{i}",
    }
    job.update({k: v for k, v in overrides.items() if k in job or k in ("title",)})
    if "company" in overrides and isinstance(overrides["company"], str):
        job["company"] = {"display_name": overrides["company"]}
    return job


def adzuna_handler_factory(pages: dict[int, list[dict]], count: int | None = None):
    def handler(request: httpx.Request) -> httpx.Response:
        path = str(request.url)
        page = 1
        if "/search/" in path:
            try:
                page = int(path.rstrip("/").split("/search/")[-1].split("?")[0])
            except ValueError:
                page = 1
        results = pages.get(page, [])
        return httpx.Response(
            200,
            json={"count": count if count is not None else sum(len(v) for v in pages.values()), "results": results},
        )

    return handler


def build_runner(tmp_checkpoint, handler, min_postings=20, max_fetch_attempts=2, batch_size=40):
    client = AdzunaClient(
        app_id="test-id",
        app_key="test-key",
        timeout=5,
        max_retries=2,
        transport=httpx.MockTransport(handler),
    )
    return ResearchGraphRunner(
        checkpoint_path=tmp_checkpoint,
        adzuna=client,
        llm=None,
        rates_to_usd={"USD": 1.0, "EUR": 0.92, "GBP": 0.79, "INR": 83.0},
        min_postings=min_postings,
        max_fetch_attempts=max_fetch_attempts,
        batch_size=batch_size,
    )

