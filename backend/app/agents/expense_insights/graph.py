from __future__ import annotations

from functools import lru_cache

from langgraph.graph import END, START, StateGraph

from app.agents.expense_insights.nodes import (
    analyze_budgets,
    analyze_spending,
    analyze_trends,
    apply_fallback,
    calculate_metrics,
    detect_anomalies,
    generate_insights,
    load_user_data,
    prepare_insight_context,
    rank_insight_nodes,
    route_after_validate,
    validate_insights,
)
from app.agents.expense_insights.state import InsightState


@lru_cache
def build_insight_graph():
    workflow = StateGraph(InsightState)
    workflow.add_node("load_user_data", load_user_data)
    workflow.add_node("calculate_metrics", calculate_metrics)
    workflow.add_node("analyze_spending", analyze_spending)
    workflow.add_node("detect_anomalies", detect_anomalies)
    workflow.add_node("analyze_budgets", analyze_budgets)
    workflow.add_node("analyze_trends", analyze_trends)
    workflow.add_node("prepare_context", prepare_insight_context)
    workflow.add_node("generate_insights", generate_insights)
    workflow.add_node("validate_insights", validate_insights)
    workflow.add_node("fallback_insights", apply_fallback)
    workflow.add_node("rank_insights", rank_insight_nodes)

    workflow.add_edge(START, "load_user_data")
    workflow.add_edge("load_user_data", "calculate_metrics")
    workflow.add_edge("calculate_metrics", "analyze_spending")
    workflow.add_edge("analyze_spending", "detect_anomalies")
    workflow.add_edge("detect_anomalies", "analyze_budgets")
    workflow.add_edge("analyze_budgets", "analyze_trends")
    workflow.add_edge("analyze_trends", "prepare_context")
    workflow.add_edge("prepare_context", "generate_insights")
    workflow.add_edge("generate_insights", "validate_insights")
    workflow.add_conditional_edges(
        "validate_insights",
        route_after_validate,
        {
            "rank_insights": "rank_insights",
            "generate_insights": "generate_insights",
            "fallback_insights": "fallback_insights",
        },
    )
    workflow.add_edge("fallback_insights", "rank_insights")
    workflow.add_edge("rank_insights", END)
    return workflow.compile()
