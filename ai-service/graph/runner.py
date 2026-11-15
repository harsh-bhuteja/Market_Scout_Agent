"""Public interface used by the FastAPI backend. No HTTP here."""

from __future__ import annotations

import logging
import sqlite3
import threading
from datetime import datetime, timezone
from typing import Any, Callable, Optional

from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.types import Command

from graph.builder import build_research_graph
from services.llm import LLMClient
from tools.adzuna import AdzunaClient, AdzunaError, configure_adzuna_client

logger = logging.getLogger("market_scout.graph")


class ResearchGraphRunner:
    def __init__(
        self,
        checkpoint_path: str,
        adzuna: AdzunaClient,
        llm: Optional[LLMClient] = None,
        rates_to_usd: Optional[dict] = None,
        min_postings: int = 20,
        max_fetch_attempts: int = 2,
        batch_size: int = 40,
    ):
        self.checkpoint_path = checkpoint_path
        self.adzuna = adzuna
        self.llm = llm
        self.rates_to_usd = rates_to_usd or {"USD": 1.0, "EUR": 0.92, "GBP": 0.79, "INR": 83.0}
        self.min_postings = min_postings
        self.max_fetch_attempts = max_fetch_attempts
        self.batch_size = batch_size
        self._lock = threading.Lock()
        self._conn = sqlite3.connect(checkpoint_path, check_same_thread=False)
        self._checkpointer = SqliteSaver(self._conn)
        self._checkpointer.setup()
        configure_adzuna_client(adzuna)
        self.graph = build_research_graph(self._checkpointer, llm=llm)
        self._listeners: dict[str, list[Callable[[dict], None]]] = {}

    def subscribe(self, thread_id: str, callback: Callable[[dict], None]) -> None:
        self._listeners.setdefault(thread_id, []).append(callback)

    def _emit(self, thread_id: str, event: dict) -> None:
        for cb in list(self._listeners.get(thread_id) or []):
            try:
                cb(event)
            except Exception:
                logger.exception("event listener failed")

    def _config(self, thread_id: str) -> dict:
        return {"configurable": {"thread_id": thread_id}}

    def start(self, thread_id: str, hiring_request: dict) -> dict:
        initial = {
            "request": hiring_request,
            "thread_id": thread_id,
            "current_stage": 1,
            "status": "in_progress",
            "needs_clarification": False,
            "clarification_questions": [],
            "clarification_answers": {},
            "search_plan": {},
            "plan_approved": False,
            "postings": [],
            "fetch_attempts": 0,
            "max_fetch_attempts": self.max_fetch_attempts,
            "duplicates_removed": 0,
            "postings_fetched_raw": 0,
            "sufficient": False,
            "batch_analyses": [],
            "logs": [],
            "rates_to_usd": self.rates_to_usd,
            "min_postings": self.min_postings,
            "batch_size": self.batch_size,
            "started_at": datetime.now(timezone.utc).isoformat(),
        }
        return self._invoke(thread_id, initial)

    def resume(self, thread_id: str, payload: Any) -> dict:
        return self._invoke(thread_id, Command(resume=payload))

    def snapshot(self, thread_id: str) -> dict:
        state = self.graph.get_state(self._config(thread_id))
        return self._to_public(thread_id, state)

    def _invoke(self, thread_id: str, payload: Any) -> dict:
        self._emit(thread_id, {"type": "status", "status": "in_progress", "text": "Graph execution started"})
        try:
            with self._lock:
                self.graph.invoke(payload, self._config(thread_id))
        except AdzunaError as exc:
            logger.error("Adzuna failure on thread %s: %s", thread_id, exc)
            self._emit(thread_id, {"type": "error", "text": str(exc)})
            return {
                "id": thread_id,
                "status": "failed",
                "error": str(exc),
                "currentStageId": 3,
                "hitlPending": False,
                "checkpoint": None,
                "logs": [],
                "report": None,
            }
        except Exception as exc:
            logger.exception("Graph failed for thread %s", thread_id)
            self._emit(thread_id, {"type": "error", "text": str(exc)})
            return {
                "id": thread_id,
                "status": "failed",
                "error": str(exc),
                "currentStageId": 1,
                "hitlPending": False,
                "checkpoint": None,
                "logs": [],
                "report": None,
            }
        state = self.graph.get_state(self._config(thread_id))
        public = self._to_public(thread_id, state)
        self._emit(thread_id, {"type": "snapshot", "status": public["status"]})
        return public

    def _to_public(self, thread_id: str, state) -> dict:
        values = dict(state.values or {})
        interrupt_payload = None
        tasks = getattr(state, "tasks", None) or []
        for task in tasks:
            interrupts = getattr(task, "interrupts", None) or []
            for item in interrupts:
                interrupt_payload = getattr(item, "value", item)
                break
            if interrupt_payload:
                break
        if interrupt_payload is None:
            interrupts = getattr(state, "interrupts", None) or []
            if interrupts:
                interrupt_payload = getattr(interrupts[0], "value", interrupts[0])

        status = values.get("status") or "in_progress"
        if values.get("error"):
            status = "failed"
        elif interrupt_payload:
            status = "paused"
        elif not state.next and values.get("report"):
            status = "completed"
        elif state.next:
            status = "in_progress"

        request = values.get("request") or {}
        report = values.get("report")
        logs = values.get("logs") or []
        return {
            "id": thread_id,
            "role": request.get("role"),
            "location": request.get("location"),
            "createdAt": values.get("started_at"),
            "status": status,
            "currentStageId": int(values.get("current_stage") or 1),
            "hiringOutlook": (report or {}).get("hiringOutlook", {}).get("verdict") if report else None,
            "totalPostingsIndexed": len(values.get("postings") or []),
            "salaryMedian": (report or {}).get("compensation", {}).get("medianSalary") if report else None,
            "currency": request.get("currency"),
            "briefId": report.get("id") if report else None,
            "hitlPending": bool(interrupt_payload),
            "checkpoint": interrupt_payload,
            "logs": logs,
            "stages": _stages(int(values.get("current_stage") or 1), status, interrupt_payload),
            "report": report,
            "reportMarkdown": values.get("report_markdown"),
            "error": values.get("error"),
            "next": list(state.next or []),
            "threadId": thread_id,
            "searchPlan": values.get("search_plan"),
            "postingsSample": [
                {
                    "id": p.get("id"),
                    "title": p.get("title"),
                    "company": p.get("company"),
                    "location": p.get("location"),
                    "salary": _salary_text(p),
                }
                for p in (values.get("postings") or [])[:8]
            ],
        }


def _salary_text(posting: dict) -> Optional[str]:
    if posting.get("salary_min") is None and posting.get("salary_max") is None:
        return None
    return f"{posting.get('salary_min')}–{posting.get('salary_max')} {posting.get('currency') or ''}".strip()


def _stages(current: int, status: str, checkpoint) -> list[dict]:
    names = [
        (1, "intake", "Intake & Clarity"),
        (2, "plan", "Search Plan"),
        (3, "retrieve", "Job Retrieval"),
        (4, "analyze", "Batch Analysis"),
        (5, "synthesize", "Evidence Synthesis"),
        (6, "report", "Market Brief"),
    ]
    out = []
    for sid, name, title in names:
        st = "pending"
        progress = 0
        if sid < current:
            st, progress = "completed", 100
        elif sid == current:
            if status == "completed":
                st, progress = "completed", 100
            elif status == "failed":
                st, progress = "failed", 40
            elif status == "paused" or checkpoint:
                st, progress = "paused", 80
            else:
                st, progress = "active", 55
        out.append(
            {
                "id": sid,
                "name": name,
                "title": title,
                "description": title,
                "status": st,
                "progressPercent": progress,
                "logs": [],
            }
        )
    return out
