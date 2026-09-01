from datetime import date

from app.analytics.engine import analyze_period


def test_flags_unusually_large_transaction(snapshot):
    analysis = analyze_period(snapshot, date(2026, 9, 1), date(2026, 9, 30), today=date(2026, 9, 16))
    large = [item for item in analysis["anomaly_analysis"] if item.get("kind") == "large_transaction"]
    assert large
    assert any(item["amount"] == 18500 for item in large)
    assert all("fraud" not in item["label"].lower() for item in large)
