from app.schemas.insights import FinancialInsight
from app.services.grounding import filter_grounded, insight_is_grounded


def test_rejects_invented_amount():
    insight = FinancialInsight(
        id="x",
        type="spending",
        title="Food spending",
        summary="You spent 25000 on food.",
        explanation="Invented",
        severity="info",
        metrics={"categories.food.current_spending": 18450},
        source="llm",
    )
    known_ok = insight_is_grounded(
        FinancialInsight(
            id="y",
            type="spending",
            title="Food spending",
            summary="You spent 18450 on food.",
            explanation="Food is 18450",
            severity="info",
            metrics={"categories.food.current_spending": 18450},
        ),
        {18450.0, 39.8, 0, 1, 2, 3},
    )
    assert known_ok
    kept, rejected = filter_grounded([insight], {"totals": {"expenses": 18450}})
    assert rejected == 1
    assert kept == []
