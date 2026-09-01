from datetime import date

from app.analytics.engine import analyze_period, totals
from app.analytics.money import percent_change, projected_spend, savings_rate


def test_totals_ignore_transfers(snapshot):
    result = totals(snapshot.transactions)
    assert result["income"] == 100000
    assert result["expenses"] == 36648
    assert result["transfers"] == 0


def test_percent_change_and_savings():
    assert round(percent_change(18450, 13200) or 0, 2) == 39.77
    assert savings_rate(10000, 7500) == 25


def test_category_aggregation(snapshot):
    analysis = analyze_period(snapshot, date(2026, 9, 1), date(2026, 9, 30), today=date(2026, 9, 16))
    food = next(item for item in analysis["category_analysis"] if item["name"] == "Food")
    transport = next(item for item in analysis["category_analysis"] if item["name"] == "Transport")
    assert food["current_spending"] == 21099
    assert food["previous_spending"] == 1249
    assert transport["current_spending"] == 6100
    assert transport["previous_spending"] == 8200
    assert food["transaction_count"] == 4
    assert food["share_of_spending"] > 70


def test_projection_matches_spec():
    assert projected_spend(7500, 15, 30) == 15000
