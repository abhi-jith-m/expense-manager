import pytest

from app.agents.expense_insights.graph import build_insight_graph
from app.agents.expense_insights.nodes import route_after_validate
from app.services.grounding import filter_grounded
from app.schemas.insights import FinancialInsight


@pytest.mark.asyncio
async def test_graph_falls_back_without_llm(snapshot, user_id):
    graph = build_insight_graph()
    result = await graph.ainvoke(
        {
            "user_id": user_id,
            "start_date": "2026-09-01",
            "end_date": "2026-09-30",
            "snapshot": snapshot.model_dump(mode="json"),
            "errors": [],
            "retry_count": 0,
            "insights": [],
        }
    )
    assert result["insights"]
    assert result["used_fallback"] is True
    kept, rejected = filter_grounded(
        [FinancialInsight.model_validate(item) for item in result["insights"]],
        result["metrics"],
    )
    assert rejected == 0
    assert kept


def test_retry_routes_to_fallback_after_max():
    state = {"validation_ok": False, "retry_count": 2, "used_fallback": False, "llm_available": True}
    assert route_after_validate(state) == "fallback_insights"
    assert route_after_validate({"validation_ok": True}) == "rank_insights"
