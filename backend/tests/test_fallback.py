from datetime import date

from app.analytics.engine import analyze_period
from app.analytics.fallback import build_fallback_insights


def test_fallback_uses_calculated_numbers(snapshot):
    analysis = analyze_period(snapshot, date(2026, 9, 1), date(2026, 9, 30), today=date(2026, 9, 16))
    insights = build_fallback_insights(analysis["metrics"])
    assert insights
    food = next(item for item in insights if item.category == "Food")
    assert "21099" in food.summary or "21,099" in food.summary
    assert all(item.metrics for item in insights)
