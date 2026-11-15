"""Adzuna Jobs API as a LangChain tool. Never fabricates postings."""

from __future__ import annotations

import logging
import time
from typing import Any, Optional

import httpx
from langchain_core.tools import tool

logger = logging.getLogger("market_scout.adzuna")

ADZUNA_BASE = "https://api.adzuna.com/v1/api/jobs"


class AdzunaError(RuntimeError):
    def __init__(self, message: str, status_code: Optional[int] = None, retryable: bool = False):
        super().__init__(message)
        self.status_code = status_code
        self.retryable = retryable


class AdzunaClient:
    def __init__(
        self,
        app_id: str,
        app_key: str,
        timeout: float = 20.0,
        max_retries: int = 3,
        transport: Optional[httpx.BaseTransport] = None,
    ):
        self.app_id = app_id
        self.app_key = app_key
        self.timeout = timeout
        self.max_retries = max_retries
        self.transport = transport

    @property
    def configured(self) -> bool:
        return bool(self.app_id and self.app_key and "your-" not in self.app_id)

    def search(
        self,
        query: str,
        location: str,
        country: str = "us",
        page: int = 1,
        results_per_page: int = 50,
        max_days_old: int = 30,
        radius_km: int = 35,
    ) -> dict[str, Any]:
        if not self.configured:
            raise AdzunaError("Adzuna credentials are not configured")
        params = {
            "app_id": self.app_id,
            "app_key": self.app_key,
            "what": query,
            "where": location,
            "results_per_page": results_per_page,
            "max_days_old": max_days_old,
            "distance": radius_km,
            "content-type": "application/json",
        }
        url = f"{ADZUNA_BASE}/{country}/search/{page}"
        last_error: Optional[Exception] = None
        for attempt in range(1, self.max_retries + 1):
            try:
                with httpx.Client(timeout=self.timeout, transport=self.transport) as client:
                    response = client.get(url, params=params)
                if response.status_code == 429:
                    raise AdzunaError("Adzuna rate limit (429)", status_code=429, retryable=True)
                if response.status_code >= 500:
                    raise AdzunaError(
                        f"Adzuna server error {response.status_code}",
                        status_code=response.status_code,
                        retryable=True,
                    )
                if response.status_code >= 400:
                    raise AdzunaError(
                        f"Adzuna request failed: {response.status_code} {response.text[:200]}",
                        status_code=response.status_code,
                        retryable=False,
                    )
                payload = response.json()
                results = []
                for item in payload.get("results") or []:
                    results.append(_normalize_result(item))
                return {
                    "count": payload.get("count", len(results)),
                    "mean_salary": payload.get("mean"),
                    "results": results,
                    "page": page,
                    "raw_result_count": len(payload.get("results") or []),
                }
            except httpx.TimeoutException as exc:
                last_error = AdzunaError("Adzuna request timed out", retryable=True)
                logger.warning("Adzuna timeout page=%s attempt=%s", page, attempt)
            except AdzunaError as exc:
                last_error = exc
                if not exc.retryable:
                    raise
                logger.warning("Adzuna retryable error page=%s attempt=%s: %s", page, attempt, exc)
            except httpx.HTTPError as exc:
                last_error = AdzunaError(f"Adzuna HTTP error: {exc}", retryable=True)
            if attempt < self.max_retries:
                time.sleep(min(2 ** attempt, 8))
        raise last_error or AdzunaError("Adzuna request failed")


def parse_salary_is_predicted(val: Any) -> bool:
    """Parse Adzuna's salary_is_predicted field.
    
    Adzuna returns '0' or 0 for genuine employer-disclosed pay,
    and '1' or 1 when predicted by Adzuna's machine learning model.
    Handles string and numeric inputs, whitespace, and case differences.
    """
    if val is None:
        return False
    if isinstance(val, bool):
        return val
    if isinstance(val, (int, float)):
        return val == 1
    s = str(val).strip().lower()
    return s in ("1", "true", "yes")


def _normalize_result(item: dict) -> dict:
    company = ""
    if isinstance(item.get("company"), dict):
        company = item["company"].get("display_name") or ""
    location = ""
    if isinstance(item.get("location"), dict):
        location = item["location"].get("display_name") or ""
    source_id = str(item.get("id") or "")
    return {
        "id": f"adz-{source_id}" if source_id else f"adz-unknown-{hash(item.get('title'))}",
        "source": "adzuna",
        "source_id": source_id,
        "title": item.get("title") or "",
        "company": company,
        "location": location,
        "description": item.get("description") or "",
        "created": item.get("created"),
        "salary_min": item.get("salary_min"),
        "salary_max": item.get("salary_max"),
        "salary_is_predicted": parse_salary_is_predicted(item.get("salary_is_predicted")),
        "currency": item.get("salary_currency") or item.get("currency"),
        "contract_time": item.get("contract_time"),
        "contract_type": item.get("contract_type"),
        "category": (item.get("category") or {}).get("label")
        if isinstance(item.get("category"), dict)
        else item.get("category"),
        "redirect_url": item.get("redirect_url"),
        "raw": item,
    }


_CLIENT: Optional[AdzunaClient] = None


def configure_adzuna_client(client: AdzunaClient) -> None:
    global _CLIENT
    _CLIENT = client


def get_adzuna_client() -> AdzunaClient:
    if _CLIENT is None:
        raise AdzunaError("Adzuna client is not configured")
    return _CLIENT


@tool("adzuna_job_search")
def adzuna_job_search(
    query: str,
    location: str,
    country: str = "us",
    page: int = 1,
    results_per_page: int = 50,
    max_days_old: int = 30,
    radius_km: int = 35,
) -> dict:
    """Search live Adzuna job postings. Returns parsed results plus raw metadata."""
    client = get_adzuna_client()
    return client.search(
        query=query,
        location=location,
        country=country,
        page=page,
        results_per_page=results_per_page,
        max_days_old=max_days_old,
        radius_km=radius_km,
    )


ADZUNA_TOOLS = [adzuna_job_search]
