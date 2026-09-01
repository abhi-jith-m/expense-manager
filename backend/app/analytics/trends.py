from __future__ import annotations

from collections import defaultdict
from datetime import date

from app.analytics.dates import monthly_windows
from app.analytics.money import from_cents, percent_change, to_cents
from app.schemas.finance import TransactionIn


def analyze_trends(
    categories: list[dict],
    monthly_series: list[dict],
    transactions: list[TransactionIn],
    names: dict[str, str],
    stable_threshold: float,
) -> dict:
    category_trends = []
    for row in categories:
        change = row.get("percentage_change")
        if change is None:
            direction = "new"
        elif abs(change) < stable_threshold:
            direction = "stable"
        elif change > 0:
            direction = "increasing"
        else:
            direction = "decreasing"
        category_trends.append({**row, "direction": direction})

    expense_series = [item["expenses"] for item in monthly_series]
    accelerating = _is_accelerating(expense_series)
    consecutive = _consecutive_direction(expense_series)

    category_acceleration = []
    windows = monthly_windows(date.fromisoformat(monthly_series[-1]["end"]) if monthly_series else date.today(), 4)
    by_month: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    for start, end in windows:
        key = start.isoformat()
        for tx in transactions:
            if tx.type != "expense" or not (start <= tx.date <= end):
                continue
            cat = names.get(tx.category_id or "", "Uncategorized")
            by_month[key][cat] += to_cents(tx.amount)
    month_keys = [start.isoformat() for start, _ in windows]
    tracked = {row["name"] for row in categories[:8]}
    for name in tracked:
        series = [from_cents(by_month[key].get(name, 0)) for key in month_keys]
        if _is_accelerating(series):
            category_acceleration.append({"name": name, "series": series})

    return {
        "categories": category_trends,
        "monthly_expenses": monthly_series,
        "accelerating_overall": accelerating,
        "consecutive_overall": consecutive,
        "accelerating_categories": category_acceleration,
    }


def _is_accelerating(series: list[float]) -> bool:
    if len(series) < 3:
        return False
    deltas = [series[i] - series[i - 1] for i in range(1, len(series))]
    if any(delta <= 0 for delta in deltas):
        return False
    return all(deltas[i] >= deltas[i - 1] for i in range(1, len(deltas)))


def _consecutive_direction(series: list[float]) -> str | None:
    if len(series) < 3:
        return None
    ups = all(series[i] > series[i - 1] for i in range(1, len(series)))
    downs = all(series[i] < series[i - 1] for i in range(1, len(series)))
    if ups:
        return "increasing"
    if downs:
        return "decreasing"
    return None
