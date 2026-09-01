from __future__ import annotations


def to_cents(amount: float) -> int:
    if amount is None:
        return 0
    return int(round(float(amount) * 100))


def from_cents(cents: int) -> float:
    return cents / 100


def add_amounts(*amounts: float) -> float:
    return from_cents(sum(to_cents(value) for value in amounts))


def subtract_amount(left: float, right: float) -> float:
    return from_cents(to_cents(left) - to_cents(right))


def percent_change(current: float, previous: float) -> float | None:
    if to_cents(previous) == 0:
        return 0.0 if to_cents(current) == 0 else None
    return ((current - previous) / abs(previous)) * 100


def savings_rate(income: float, expenses: float) -> float:
    if to_cents(income) == 0:
        return 0.0
    return ((income - expenses) / income) * 100


def usage_percent(spent: float, limit: float) -> float:
    if to_cents(limit) <= 0:
        return 0.0
    return (spent / limit) * 100


def remaining(limit: float, spent: float) -> float:
    return subtract_amount(limit, spent)


def projected_spend(spent: float, elapsed_days: int, total_days: int) -> float:
    if elapsed_days <= 0:
        return spent
    return from_cents(round((to_cents(spent) / elapsed_days) * total_days))


def mean(values: list[float]) -> float:
    if not values:
        return 0.0
    return from_cents(round(sum(to_cents(value) for value in values) / len(values)))
