from datetime import date

from app.analytics.budgets import classify_budget
from app.analytics.engine import analyze_period


def test_budget_classification():
    assert classify_budget(50, 80, 9000, 10000) == "healthy"
    assert classify_budget(82, 80, 9000, 10000) == "approaching_limit"
    assert classify_budget(75, 80, 15000, 10000) == "likely_to_exceed"
    assert classify_budget(110, 80, 16000, 10000) == "exceeded"


def test_budget_projection(snapshot):
    analysis = analyze_period(snapshot, date(2026, 9, 1), date(2026, 9, 30), today=date(2026, 9, 16))
    food = analysis["budget_analysis"][0]
    assert food["spent"] == 21099
    assert food["status"] == "exceeded"
    assert food["percentage_used"] > 100
