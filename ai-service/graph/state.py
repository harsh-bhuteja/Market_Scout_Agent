from __future__ import annotations

import operator
from typing import Annotated, Any, Optional, TypedDict

from langchain_core.messages import AnyMessage
from langgraph.graph.message import add_messages


def merge_dicts(left: dict, right: dict) -> dict:
    merged = dict(left or {})
    merged.update(right or {})
    return merged


def take_latest(a: Any, b: Any) -> Any:
    return b


class GraphState(TypedDict, total=False):
    messages: Annotated[list[AnyMessage], add_messages]
    request: dict
    thread_id: str
    current_stage: Annotated[int, take_latest]
    status: str
    needs_clarification: bool
    clarification_questions: list
    clarification_answers: dict
    search_plan: dict
    plan_approved: bool
    country: str
    postings: list
    fetch_attempts: int
    max_fetch_attempts: int
    duplicates_removed: int
    postings_fetched_raw: int
    sufficient: bool
    low_data_decision: Optional[str]
    confidence_floor: str
    batch_analyses: Annotated[list, operator.add]
    stats: dict
    report: dict
    report_markdown: str
    logs: Annotated[list, operator.add]
    error: Optional[str]
    interrupt_type: Optional[str]
    started_at: str
    finished_at: str
    rates_to_usd: dict
    min_postings: int
    batch_size: int
