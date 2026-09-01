from datetime import date

from app.analytics.dates import parse_natural_range, previous_period, resolve_preset


def test_current_month_and_previous(monkeypatch):
    today = date(2026, 9, 16)
    start, end = resolve_preset("current_month", today)
    assert start == date(2026, 9, 1)
    assert end == date(2026, 9, 30)
    prev_start, prev_end = previous_period(start, end)
    assert prev_start == date(2026, 8, 1)
    assert prev_end == date(2026, 8, 31)


def test_natural_language_dates():
    today = date(2026, 9, 16)
    assert parse_natural_range("this month", today) == (date(2026, 9, 1), date(2026, 9, 30))
    assert parse_natural_range("last month", today) == (date(2026, 8, 1), date(2026, 8, 31))
    start, end = parse_natural_range("in August", today) or (None, None)
    assert start == date(2026, 8, 1)
    assert end == date(2026, 8, 31)
    start, end = parse_natural_range("since January", today) or (None, None)
    assert start == date(2026, 1, 1)
    assert end == today
