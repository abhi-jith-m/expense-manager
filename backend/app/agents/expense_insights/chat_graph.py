from __future__ import annotations

from functools import lru_cache

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph

from app.agents.expense_insights.nodes import (
    calculate_metrics,
    generate_chat_answer,
    load_user_data,
    parse_question_dates,
    prepare_insight_context,
)
from app.agents.expense_insights.state import InsightState


@lru_cache
def build_chat_graph():
    workflow = StateGraph(InsightState)
    workflow.add_node("parse_dates", parse_question_dates)
    workflow.add_node("load_user_data", load_user_data)
    workflow.add_node("calculate_metrics", calculate_metrics)
    workflow.add_node("prepare_context", prepare_insight_context)
    workflow.add_node("generate_answer", generate_chat_answer)
    workflow.add_edge(START, "parse_dates")
    workflow.add_edge("parse_dates", "load_user_data")
    workflow.add_edge("load_user_data", "calculate_metrics")
    workflow.add_edge("calculate_metrics", "prepare_context")
    workflow.add_edge("prepare_context", "generate_answer")
    workflow.add_edge("generate_answer", END)
    return workflow.compile(checkpointer=MemorySaver())
