from __future__ import annotations

from collections import defaultdict

from app.analytics.money import from_cents, mean, to_cents
from app.schemas.finance import RecurringIn, TransactionIn


def analyze_behavior(
    current: list[TransactionIn],
    recurring: list[RecurringIn],
    names: dict[str, str],
) -> dict:
    expenses = [tx for tx in current if tx.type == "expense"]
    weekday_cents = 0
    weekend_cents = 0
    weekday_days = set()
    weekend_days = set()
    for tx in expenses:
        if tx.date.weekday() >= 5:
            weekend_cents += to_cents(tx.amount)
            weekend_days.add(tx.date)
        else:
            weekday_cents += to_cents(tx.amount)
            weekday_days.add(tx.date)
    weekday_avg = from_cents(round(weekday_cents / max(1, len(weekday_days)))) if weekday_days else 0
    weekend_avg = from_cents(round(weekend_cents / max(1, len(weekend_days)))) if weekend_days else 0
    weekend_lift = ((weekend_avg - weekday_avg) / weekday_avg * 100) if weekday_avg else 0

    income_dates = sorted({tx.date for tx in current if tx.type == "income"})
    payday_cents = 0
    payday_count = 0
    for income_day in income_dates:
        for tx in expenses:
            delta = (tx.date - income_day).days
            if 0 <= delta <= 3:
                payday_cents += to_cents(tx.amount)
                payday_count += 1

    subscriptions = detect_subscriptions(current, recurring)
    dining = [
        tx
        for tx in expenses
        if names.get(tx.category_id or "", "").lower() in {"food", "dining", "restaurants"}
        or any(token in (tx.merchant or "").lower() for token in ("zomato", "swiggy", "uber eats", "restaurant"))
    ]
    shopping = [
        tx
        for tx in expenses
        if names.get(tx.category_id or "", "").lower() in {"shopping", "clothes", "apparel"}
    ]
    shopping_days = defaultdict(int)
    for tx in shopping:
        shopping_days[tx.date] += 1
    bursts = sum(1 for count in shopping_days.values() if count >= 3)

    total_expenses = from_cents(sum(to_cents(tx.amount) for tx in expenses))
    concentration = []
    by_cat: dict[str, int] = defaultdict(int)
    for tx in expenses:
        by_cat[names.get(tx.category_id or "", "Uncategorized")] += to_cents(tx.amount)
    for name, cents in by_cat.items():
        share = (from_cents(cents) / total_expenses * 100) if total_expenses else 0
        if share >= 30:
            concentration.append({"name": name, "share": share})

    return {
        "weekday_spend": from_cents(weekday_cents),
        "weekend_spend": from_cents(weekend_cents),
        "weekday_daily_average": weekday_avg,
        "weekend_daily_average": weekend_avg,
        "weekend_lift_percent": weekend_lift,
        "payday_spend": from_cents(payday_cents),
        "payday_transaction_count": payday_count,
        "subscriptions": subscriptions,
        "subscription_count": len(subscriptions),
        "subscription_total": from_cents(sum(to_cents(item["amount"]) for item in subscriptions)),
        "dining_count": len(dining),
        "dining_spend": from_cents(sum(to_cents(tx.amount) for tx in dining)),
        "shopping_burst_days": bursts,
        "concentrated_categories": concentration,
    }


def detect_subscriptions(transactions: list[TransactionIn], recurring: list[RecurringIn]) -> list[dict]:
    found: dict[str, dict] = {}
    for rule in recurring:
        if not rule.active or rule.type != "expense":
            continue
        key = (rule.merchant or "Recurring").strip() or "Recurring"
        found[key.lower()] = {
            "name": key,
            "amount": rule.amount,
            "frequency": rule.frequency,
            "source": "rule",
        }
    by_merchant: dict[str, list[TransactionIn]] = defaultdict(list)
    for tx in transactions:
        if tx.type != "expense" or not tx.merchant.strip():
            continue
        by_merchant[tx.merchant.strip().lower()].append(tx)
    for name, items in by_merchant.items():
        if name in found or len(items) < 2:
            continue
        amounts = [tx.amount for tx in items]
        avg = mean(amounts)
        similar = all(abs(to_cents(amount) - to_cents(avg)) <= max(100, to_cents(avg) * 0.08) for amount in amounts)
        dates = sorted(tx.date for tx in items)
        gaps = [(dates[i] - dates[i - 1]).days for i in range(1, len(dates))]
        regular = gaps and all(20 <= gap <= 40 or 6 <= gap <= 9 for gap in gaps)
        if similar and (regular or len(items) >= 3):
            found[name] = {
                "name": items[0].merchant.strip(),
                "amount": avg,
                "frequency": "monthly" if any(gap >= 20 for gap in gaps) else "weekly",
                "source": "detected",
            }
    return list(found.values())
