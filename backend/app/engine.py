from __future__ import annotations

import sys
from app.config import ROOT_DIR, settings

AI_SERVICE = ROOT_DIR / "ai-service"
if str(AI_SERVICE) not in sys.path:
    sys.path.insert(0, str(AI_SERVICE))

from graph.runner import ResearchGraphRunner  # noqa: E402
from services.llm import LLMClient  # noqa: E402
from tools.adzuna import AdzunaClient  # noqa: E402

_runner: ResearchGraphRunner | None = None


def get_runner() -> ResearchGraphRunner:
    global _runner
    if _runner is None:
        adzuna = AdzunaClient(
            app_id=settings.adzuna_app_id,
            app_key=settings.adzuna_app_key,
            timeout=settings.adzuna_timeout_seconds,
            max_retries=settings.adzuna_max_retries,
        )
        llm = LLMClient(
            model=settings.llm_model,
            api_key=settings.llm_api_key,
            base_url=settings.llm_base_url,
            fallback_model=settings.llm_fallback_model or None,
        )
        _runner = ResearchGraphRunner(
            checkpoint_path=settings.checkpoint_path,
            adzuna=adzuna,
            llm=llm,
            rates_to_usd={"USD": 1.0, "EUR": settings.usd_eur, "GBP": settings.usd_gbp, "INR": settings.usd_inr},
            min_postings=settings.min_postings,
            max_fetch_attempts=settings.max_fetch_attempts,
            batch_size=settings.batch_size,
        )
    return _runner


def reset_runner(runner: ResearchGraphRunner | None = None) -> None:
    global _runner
    _runner = runner
