from __future__ import annotations

from typing import Optional

from langgraph.graph import END, START, StateGraph
from langgraph.prebuilt import ToolNode

from graph.state import GraphState
from nodes.analyze import analyze_batch, plan_batches
from nodes.intake import clarification_node, intake_node
from nodes.report import report_node
from nodes.retrieve import ingest_postings, plan_adzuna_calls, sufficiency_node
from nodes.search_plan import plan_approval_node, search_plan_node
from nodes.synthesize import synthesize_node
from services.llm import LLMClient
from tools.adzuna import ADZUNA_TOOLS


def _route_after_sufficiency(state: GraphState):
    if state.get("error"):
        return END
    if not state.get("sufficient"):
        return "plan_adzuna_calls"
    return plan_batches(state)


def build_research_graph(checkpointer, llm: Optional[LLMClient] = None):
    graph = StateGraph(GraphState)
    tool_node = ToolNode(ADZUNA_TOOLS, handle_tool_errors=False)

    graph.add_node("intake", intake_node)
    graph.add_node("clarification", clarification_node)
    graph.add_node("draft_search_plan", search_plan_node)
    graph.add_node("plan_approval", plan_approval_node)
    graph.add_node("plan_adzuna_calls", plan_adzuna_calls)
    graph.add_node("adzuna_tools", tool_node)
    graph.add_node("ingest_postings", ingest_postings)
    graph.add_node("sufficiency", sufficiency_node)
    def _analyze(state):
        return analyze_batch(state, llm=llm)

    def _report(state):
        return report_node(state, llm=llm)

    graph.add_node("analyze_batch", _analyze)
    graph.add_node("synthesize", synthesize_node)
    graph.add_node("generate_report", _report)

    graph.add_edge(START, "intake")
    graph.add_edge("intake", "clarification")
    graph.add_edge("clarification", "draft_search_plan")
    graph.add_edge("draft_search_plan", "plan_approval")
    graph.add_edge("plan_approval", "plan_adzuna_calls")
    graph.add_edge("plan_adzuna_calls", "adzuna_tools")
    graph.add_edge("adzuna_tools", "ingest_postings")
    graph.add_edge("ingest_postings", "sufficiency")
    graph.add_conditional_edges("sufficiency", _route_after_sufficiency)
    graph.add_edge("analyze_batch", "synthesize")
    graph.add_edge("synthesize", "generate_report")
    graph.add_edge("generate_report", END)

    return graph.compile(checkpointer=checkpointer)
