from __future__ import annotations

from collections import defaultdict
from datetime import date
from statistics import pstdev

from app.analytics.behavior import analyze_behavior
from app.analytics.budgets import analyze_budgets
from app.analytics.dates import days_in_range, elapsed_days, monthly_windows, previous_period
from app.analytics.money import (
    from_cents,
    mean,
    percent_change,
    projected_spend,
    remaining,
    savings_rate,
    to_cents,
    usage_percent,
)
from app.analytics.trends import analyze_trends
from app.schemas.finance import AccountIn, FinanceSnapshot, TransactionIn


def in_range(tx: TransactionIn, start: date, end: date) -> bool:
    return start <= tx.date <= end


def filter_period(transactions: list[TransactionIn], start: date, end: date) -> list[TransactionIn]:
    return [tx for tx in transactions if in_range(tx, start, end)]


def expenses_only(transactions: list[TransactionIn]) -> list[TransactionIn]:
    return [tx for tx in transactions if tx.type == "expense"]


def income_only(transactions: list[TransactionIn]) -> list[TransactionIn]:
    return [tx for tx in transactions if tx.type == "income"]


def totals(transactions: list[TransactionIn]) -> dict[str, float]:
    income = from_cents(sum(to_cents(tx.amount) for tx in transactions if tx.type == "income"))
    expense = from_cents(sum(to_cents(tx.amount) for tx in transactions if tx.type == "expense"))
    transfers = from_cents(sum(to_cents(tx.amount) for tx in transactions if tx.type == "transfer"))
    savings = from_cents(to_cents(income) - to_cents(expense))
    return {
        "income": income,
        "expenses": expense,
        "transfers": transfers,
        "savings": savings,
        "savings_rate": savings_rate(income, expense),
        "transaction_count": float(len(transactions)),
        "expense_count": float(len(expenses_only(transactions))),
        "income_count": float(len(income_only(transactions))),
    }


def account_balance(account: AccountIn, transactions: list[TransactionIn]) -> float:
    cents = to_cents(account.opening_balance)
    for tx in transactions:
        if tx.type == "transfer":
            if tx.account_id == account.id:
                cents -= to_cents(tx.amount)
            if tx.to_account_id == account.id:
                cents += to_cents(tx.amount)
            continue
        if tx.account_id != account.id:
            continue
        if tx.type == "income":
            cents += to_cents(tx.amount)
        if tx.type == "expense":
            cents += to_cents(tx.amount) if account.type == "credit" else -to_cents(tx.amount)
    return from_cents(cents)


def _group_sum(
    transactions: list[TransactionIn],
    key_fn,
) -> dict[str, float]:
    grouped: dict[str, int] = defaultdict(int)
    for tx in transactions:
        grouped[key_fn(tx)] += to_cents(tx.amount)
    return {key: from_cents(value) for key, value in grouped.items()}


def category_analysis(
    current: list[TransactionIn],
    previous: list[TransactionIn],
    names: dict[str, str],
    total_expenses: float,
) -> list[dict]:
    current_map = _group_sum(expenses_only(current), lambda tx: tx.category_id or "uncategorized")
    previous_map = _group_sum(expenses_only(previous), lambda tx: tx.category_id or "uncategorized")
    counts: dict[str, int] = defaultdict(int)
    for tx in expenses_only(current):
        counts[tx.category_id or "uncategorized"] += 1
    keys = set(current_map) | set(previous_map)
    rows: list[dict] = []
    for key in keys:
        current_spend = current_map.get(key, 0)
        previous_spend = previous_map.get(key, 0)
        count = counts.get(key, 0)
        rows.append(
            {
                "id": key,
                "name": names.get(key, "Uncategorized"),
                "current_spending": current_spend,
                "previous_spending": previous_spend,
                "absolute_change": subtract_safe(current_spend, previous_spend),
                "percentage_change": percent_change(current_spend, previous_spend),
                "transaction_count": count,
                "average_transaction": mean(
                    [tx.amount for tx in expenses_only(current) if (tx.category_id or "uncategorized") == key]
                ),
                "share_of_spending": (current_spend / total_expenses * 100) if to_cents(total_expenses) else 0,
            }
        )
    rows.sort(key=lambda item: item["current_spending"], reverse=True)
    return rows


def subtract_safe(left: float, right: float) -> float:
    return from_cents(to_cents(left) - to_cents(right))


def merchant_analysis(current: list[TransactionIn], previous: list[TransactionIn]) -> list[dict]:
    current_map = _group_sum(expenses_only(current), lambda tx: tx.merchant.strip() or "Unspecified")
    previous_map = _group_sum(expenses_only(previous), lambda tx: tx.merchant.strip() or "Unspecified")
    counts: dict[str, int] = defaultdict(int)
    ids: dict[str, list[str]] = defaultdict(list)
    for tx in expenses_only(current):
        name = tx.merchant.strip() or "Unspecified"
        counts[name] += 1
        ids[name].append(tx.id)
    rows = []
    for name, current_spend in current_map.items():
        previous_spend = previous_map.get(name, 0)
        rows.append(
            {
                "name": name,
                "current_spending": current_spend,
                "previous_spending": previous_spend,
                "absolute_change": subtract_safe(current_spend, previous_spend),
                "percentage_change": percent_change(current_spend, previous_spend),
                "transaction_count": counts[name],
                "related_transaction_ids": ids[name][:8],
            }
        )
    rows.sort(key=lambda item: item["current_spending"], reverse=True)
    return rows[:12]


def detect_anomalies(current: list[TransactionIn], history: list[TransactionIn]) -> list[dict]:
    expense_history = expenses_only(history)
    amounts = [tx.amount for tx in expense_history]
    anomalies: list[dict] = []
    if len(amounts) >= 4:
        avg = mean(amounts)
        std = pstdev(amounts) if len(amounts) > 1 else 0
        q1, q3 = _quartiles(sorted(amounts))
        iqr = q3 - q1
        upper = q3 + 1.5 * iqr if iqr else avg * 2
        for tx in expenses_only(current):
            z = ((tx.amount - avg) / std) if std else 0
            if tx.amount >= upper or z >= 2.5:
                anomalies.append(
                    {
                        "kind": "large_transaction",
                        "transaction_id": tx.id,
                        "merchant": tx.merchant or "Unspecified",
                        "amount": tx.amount,
                        "date": tx.date.isoformat(),
                        "z_score": round(z, 2),
                        "typical_range_high": round(upper, 2),
                        "label": "Unusually large transaction.",
                    }
                )
    by_day: dict[date, int] = defaultdict(int)
    for tx in expenses_only(current):
        by_day[tx.date] += 1
    if by_day:
        daily_counts = list(by_day.values())
        avg_count = sum(daily_counts) / len(daily_counts)
        for day, count in by_day.items():
            if count >= max(4, avg_count * 2.5):
                anomalies.append(
                    {
                        "kind": "frequency_spike",
                        "date": day.isoformat(),
                        "transaction_count": count,
                        "label": "Unusually frequent transactions.",
                    }
                )
    return anomalies[:8]


def _quartiles(sorted_values: list[float]) -> tuple[float, float]:
    if not sorted_values:
        return 0.0, 0.0
    n = len(sorted_values)
    return sorted_values[n // 4], sorted_values[(3 * n) // 4]


def spending_breakdowns(current: list[TransactionIn], snapshot: FinanceSnapshot) -> dict:
    accounts = {item.id: item.name for item in snapshot.accounts}
    by_account = _group_sum(expenses_only(current), lambda tx: accounts.get(tx.account_id, tx.account_id))
    by_method = _group_sum(expenses_only(current), lambda tx: tx.payment_method or "other")
    by_income = _group_sum(income_only(current), lambda tx: tx.merchant.strip() or "Unspecified")
    return {
        "by_account": by_account,
        "by_payment_method": by_method,
        "income_by_source": by_income,
    }


def analyze_period(
    snapshot: FinanceSnapshot,
    start: date,
    end: date,
    today: date | None = None,
    stable_threshold: float = 5.0,
) -> dict:
    now = today or date.today()
    prev_start, prev_end = previous_period(start, end)
    current = filter_period(snapshot.transactions, start, end)
    previous = filter_period(snapshot.transactions, prev_start, prev_end)
    names = {item.id: item.name for item in snapshot.categories}
    current_totals = totals(current)
    previous_totals = totals(previous)
    expense_txs = expenses_only(current)
    amounts = [tx.amount for tx in expense_txs]
    largest = max(expense_txs, key=lambda tx: tx.amount, default=None)
    smallest = min(expense_txs, key=lambda tx: tx.amount, default=None)
    days = days_in_range(start, end)
    elapsed = elapsed_days(start, end, now)
    categories = category_analysis(current, previous, names, current_totals["expenses"])
    merchants = merchant_analysis(current, previous)
    breakdowns = spending_breakdowns(current, snapshot)
    windows = monthly_windows(end, 4)
    monthly_series = [
        {
            "start": window[0].isoformat(),
            "end": window[1].isoformat(),
            "expenses": totals(filter_period(snapshot.transactions, *window))["expenses"],
        }
        for window in windows
    ]
    trends = analyze_trends(categories, monthly_series, snapshot.transactions, names, stable_threshold)
    anomalies = detect_anomalies(current, snapshot.transactions)
    budgets = analyze_budgets(snapshot.budgets, current, names, start, end, now)
    behavior = analyze_behavior(current, snapshot.recurring, names)
    accounts = [
        {
            "id": account.id,
            "name": account.name,
            "type": account.type,
            "balance": account_balance(account, snapshot.transactions),
            "period_spend": breakdowns["by_account"].get(account.name, 0),
        }
        for account in snapshot.accounts
        if account.status != "archived"
    ]
    goals = [
        {
            "id": goal.id,
            "name": goal.name,
            "target_amount": goal.target_amount,
            "current_amount": goal.current_amount,
            "progress_percent": usage_percent(goal.current_amount, goal.target_amount),
            "remaining": remaining(goal.target_amount, goal.current_amount),
            "deadline": goal.deadline.isoformat() if goal.deadline else None,
        }
        for goal in snapshot.goals
    ]
    metrics = {
        "period": {
            "start": start.isoformat(),
            "end": end.isoformat(),
            "comparison_start": prev_start.isoformat(),
            "comparison_end": prev_end.isoformat(),
            "days": days,
            "elapsed_days": elapsed,
        },
        "totals": {
            **current_totals,
            "average_daily_spend": from_cents(round(to_cents(current_totals["expenses"]) / days)),
            "average_transaction": mean(amounts),
            "largest_transaction": largest.amount if largest else 0,
            "smallest_transaction": smallest.amount if smallest else 0,
            "previous_expenses": previous_totals["expenses"],
            "previous_income": previous_totals["income"],
            "previous_savings": previous_totals["savings"],
            "previous_savings_rate": previous_totals["savings_rate"],
            "expense_change": percent_change(current_totals["expenses"], previous_totals["expenses"]),
            "income_change": percent_change(current_totals["income"], previous_totals["income"]),
            "savings_change": percent_change(current_totals["savings"], previous_totals["savings"]),
            "projected_period_spend": projected_spend(current_totals["expenses"], elapsed, days),
        },
        "categories": categories,
        "merchants": merchants,
        "breakdowns": breakdowns,
        "trends": trends,
        "anomalies": anomalies,
        "budgets": budgets,
        "behavior": behavior,
        "accounts": accounts,
        "goals": goals,
        "top_transactions": [
            {
                "id": tx.id,
                "merchant": tx.merchant or tx.description or "Untitled",
                "amount": tx.amount,
                "date": tx.date.isoformat(),
                "category": names.get(tx.category_id or "", "Uncategorized"),
            }
            for tx in sorted(expense_txs, key=lambda item: item.amount, reverse=True)[:8]
        ],
        "currency": snapshot.currency,
    }
    return {
        "current_transactions": current,
        "previous_transactions": previous,
        "metrics": metrics,
        "category_analysis": categories,
        "merchant_analysis": merchants,
        "trend_analysis": trends,
        "anomaly_analysis": anomalies,
        "budget_analysis": budgets,
    }


def flatten_metrics(metrics: dict) -> dict[str, float]:
    flat: dict[str, float] = {}

    def walk(prefix: str, value: object) -> None:
        if isinstance(value, dict):
            for key, inner in value.items():
                walk(f"{prefix}.{key}" if prefix else str(key), inner)
            return
        if isinstance(value, list):
            for item in value:
                if isinstance(item, dict) and "name" in item:
                    walk(f"{prefix}.{_slug(str(item['name']))}", item)
                elif isinstance(item, dict) and "id" in item:
                    walk(f"{prefix}.{_slug(str(item['id']))}", item)
            return
        if isinstance(value, bool):
            return
        if isinstance(value, (int, float)) and not isinstance(value, bool):
            flat[prefix] = float(value)

    walk("", metrics)
    return flat


def _slug(value: str) -> str:
    return "".join(ch.lower() if ch.isalnum() else "_" for ch in value).strip("_")
