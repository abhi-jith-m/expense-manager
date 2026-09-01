from __future__ import annotations

from datetime import date

from app.analytics.dates import days_in_range, elapsed_days, remaining_days
from app.analytics.money import from_cents, projected_spend, remaining, to_cents, usage_percent
from app.schemas.finance import BudgetIn, TransactionIn


def analyze_budgets(
    budgets: list[BudgetIn],
    current: list[TransactionIn],
    names: dict[str, str],
    start: date,
    end: date,
    today: date,
) -> list[dict]:
    rows = []
    days = days_in_range(start, end)
    elapsed = elapsed_days(start, end, today)
    leftover = remaining_days(end, today)
    for budget in budgets:
        spent = from_cents(
            sum(
                to_cents(tx.amount)
                for tx in current
                if tx.type == "expense" and (budget.category_id is None or tx.category_id == budget.category_id)
            )
        )
        used = usage_percent(spent, budget.limit_amount)
        projected = projected_spend(spent, elapsed, days)
        status = classify_budget(used, budget.alert_threshold, projected, budget.limit_amount)
        rows.append(
            {
                "id": budget.id,
                "name": budget.name,
                "category": names.get(budget.category_id or "", None),
                "budget_limit": budget.limit_amount,
                "spent": spent,
                "remaining": remaining(budget.limit_amount, spent),
                "percentage_used": used,
                "days_elapsed": elapsed,
                "days_remaining": leftover,
                "average_daily_spend": from_cents(round(to_cents(spent) / elapsed)),
                "projected_month_end_spend": projected,
                "projected_over_by": remaining(projected, budget.limit_amount)
                if projected > budget.limit_amount
                else 0,
                "status": status,
                "alert_threshold": budget.alert_threshold,
            }
        )
    return rows


def classify_budget(used: float, threshold: float, projected: float, limit: float) -> str:
    if used >= 100:
        return "exceeded"
    if projected > limit:
        return "likely_to_exceed"
    if used >= threshold:
        return "approaching_limit"
    return "healthy"
