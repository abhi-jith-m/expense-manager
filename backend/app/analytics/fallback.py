from __future__ import annotations

from app.analytics.money import from_cents, to_cents
from app.schemas.insights import FinancialInsight


def build_fallback_insights(metrics: dict) -> list[FinancialInsight]:
    insights: list[FinancialInsight] = []
    totals = metrics.get("totals", {})
    currency = metrics.get("currency", "USD")
    change = totals.get("expense_change")
    if change is not None and abs(change) >= 5:
        direction = "increased" if change > 0 else "decreased"
        insights.append(
            FinancialInsight(
                id="spend-change",
                type="spending",
                title=f"Spending {direction} {abs(change):.1f}%",
                summary=f"Expenses {direction} from {_money(totals.get('previous_expenses', 0), currency)} to {_money(totals.get('expenses', 0), currency)}.",
                explanation=f"Total expenses moved {change:+.1f}% versus the previous period.",
                severity="warning" if change > 0 else "positive",
                impact_score=min(100, abs(change)),
                metrics={
                    "totals.expenses": totals.get("expenses", 0),
                    "totals.previous_expenses": totals.get("previous_expenses", 0),
                    "totals.expense_change": change,
                },
            )
        )

    for row in metrics.get("categories", [])[:6]:
        pct = row.get("percentage_change")
        if pct is None or abs(pct) < 12 or row.get("previous_spending", 0) <= 0:
            continue
        insights.append(
            FinancialInsight(
                id=f"category-{_slug(row['name'])}",
                type="spending",
                title=f"{row['name']} spending {('rose' if pct > 0 else 'fell')} {abs(pct):.1f}%",
                summary=f"{row['name']}: {_money(row['previous_spending'], currency)} → {_money(row['current_spending'], currency)}.",
                explanation=f"{row['name']} changed by {pct:+.1f}% and now represents {row['share_of_spending']:.1f}% of spending.",
                severity="warning" if pct > 0 else "positive",
                impact_score=min(100, abs(pct) * (row.get("share_of_spending") or 0) / 20),
                metrics={
                    f"categories.{_slug(row['name'])}.current_spending": row["current_spending"],
                    f"categories.{_slug(row['name'])}.previous_spending": row["previous_spending"],
                    f"categories.{_slug(row['name'])}.percentage_change": pct,
                    f"categories.{_slug(row['name'])}.share_of_spending": row["share_of_spending"],
                    f"categories.{_slug(row['name'])}.transaction_count": row["transaction_count"],
                },
                category=row["name"],
            )
        )

    for trend in metrics.get("trends", {}).get("categories", []):
        if trend.get("direction") == "decreasing" and (trend.get("percentage_change") or 0) <= -12:
            insights.append(
                FinancialInsight(
                    id=f"trend-{_slug(trend['name'])}",
                    type="trend",
                    title=f"{trend['name']} spending decreased",
                    summary=f"{trend['name']} is down {abs(trend['percentage_change']):.1f}% versus the previous period.",
                    explanation="This is a decreasing spending trend based on period-over-period totals.",
                    severity="positive",
                    impact_score=min(80, abs(trend["percentage_change"])),
                    metrics={
                        f"categories.{_slug(trend['name'])}.percentage_change": trend["percentage_change"],
                        f"categories.{_slug(trend['name'])}.current_spending": trend["current_spending"],
                    },
                    category=trend["name"],
                )
            )

    if metrics.get("trends", {}).get("accelerating_overall"):
        series = [item["expenses"] for item in metrics.get("trends", {}).get("monthly_expenses", [])]
        insights.append(
            FinancialInsight(
                id="accelerating-spend",
                type="trend",
                title="Spending is accelerating",
                summary="Monthly expenses have increased by larger amounts across recent months.",
                explanation="Each recent month spent more than the last, and the increases themselves are growing.",
                severity="warning",
                impact_score=70,
                metrics={f"trends.monthly_{index}": value for index, value in enumerate(series)},
            )
        )

    for anomaly in metrics.get("anomalies", [])[:3]:
        if anomaly.get("kind") != "large_transaction":
            continue
        insights.append(
            FinancialInsight(
                id=f"anomaly-{anomaly['transaction_id']}",
                type="anomaly",
                title="Unusually large transaction",
                summary=f"{_money(anomaly['amount'], currency)} at {anomaly['merchant']} on {anomaly['date']}.",
                explanation="This amount is well above your typical transaction size. It is flagged as unusual, not as fraud.",
                severity="warning",
                impact_score=60,
                metrics={"anomaly.amount": anomaly["amount"], "anomaly.typical_range_high": anomaly.get("typical_range_high", 0)},
                related_transaction_ids=[anomaly["transaction_id"]],
            )
        )

    for budget in metrics.get("budgets", []):
        status = budget["status"]
        if status == "healthy":
            continue
        severity = "critical" if status == "exceeded" else "warning"
        over = budget.get("projected_over_by") or 0
        title = {
            "exceeded": f"{budget['name']} budget exceeded",
            "likely_to_exceed": f"{budget['name']} is projected to exceed its limit",
            "approaching_limit": f"{budget['name']} is approaching its limit",
        }[status]
        insights.append(
            FinancialInsight(
                id=f"budget-{budget['id']}",
                type="budget",
                title=title,
                summary=f"{_money(budget['spent'], currency)} of {_money(budget['budget_limit'], currency)} used ({budget['percentage_used']:.0f}%).",
                explanation=(
                    f"At {_money(budget['average_daily_spend'], currency)} per day, projected spending is "
                    f"{_money(budget['projected_month_end_spend'], currency)}."
                    + (f" That is {_money(over, currency)} over the limit." if over else "")
                ),
                severity=severity,
                impact_score=90 if status == "exceeded" else 75,
                metrics={
                    f"budgets.{_slug(budget['name'])}.spent": budget["spent"],
                    f"budgets.{_slug(budget['name'])}.budget_limit": budget["budget_limit"],
                    f"budgets.{_slug(budget['name'])}.percentage_used": budget["percentage_used"],
                    f"budgets.{_slug(budget['name'])}.projected_month_end_spend": budget["projected_month_end_spend"],
                    f"budgets.{_slug(budget['name'])}.projected_over_by": over,
                },
                category=budget.get("category"),
                recommendation=(
                    f"You could consider pausing discretionary spend in {budget.get('category') or 'this area'} "
                    f"to stay closer to {_money(budget['budget_limit'], currency)}."
                    if status != "healthy"
                    else None
                ),
            )
        )

    behavior = metrics.get("behavior", {})
    lift = behavior.get("weekend_lift_percent") or 0
    if abs(lift) >= 15 and behavior.get("weekend_daily_average"):
        insights.append(
            FinancialInsight(
                id="weekend-spend",
                type="behavior",
                title="Weekend spending is higher than weekdays",
                summary=f"Weekend daily spending is {lift:.0f}% above the weekday average.",
                explanation=(
                    f"Weekday average {_money(behavior['weekday_daily_average'], currency)} versus "
                    f"weekend average {_money(behavior['weekend_daily_average'], currency)}."
                ),
                severity="info",
                impact_score=40,
                metrics={
                    "behavior.weekend_lift_percent": lift,
                    "behavior.weekday_daily_average": behavior["weekday_daily_average"],
                    "behavior.weekend_daily_average": behavior["weekend_daily_average"],
                },
            )
        )

    if behavior.get("subscription_count", 0) >= 2:
        insights.append(
            FinancialInsight(
                id="subscriptions",
                type="recurring",
                title=f"{behavior['subscription_count']} recurring subscriptions",
                summary=f"About {_money(behavior['subscription_total'], currency)} per cycle across {behavior['subscription_count']} recurring items.",
                explanation="These are repeated merchants or saved recurring rules, not a forecast.",
                severity="info",
                impact_score=45,
                metrics={
                    "behavior.subscription_count": behavior["subscription_count"],
                    "behavior.subscription_total": behavior["subscription_total"],
                },
                recommendation="You could consider reviewing unused subscriptions.",
            )
        )

    prev_rate = totals.get("previous_savings_rate") or 0
    rate = totals.get("savings_rate") or 0
    if totals.get("income", 0) > 0 and abs(rate - prev_rate) >= 3:
        insights.append(
            FinancialInsight(
                id="savings-rate",
                type="savings",
                title=f"Savings rate is {rate:.0f}%",
                summary=f"Savings rate moved from {prev_rate:.0f}% to {rate:.0f}%.",
                explanation=f"Income {_money(totals.get('income', 0), currency)} minus expenses {_money(totals.get('expenses', 0), currency)}.",
                severity="positive" if rate > prev_rate else "warning",
                impact_score=55,
                metrics={
                    "totals.savings_rate": rate,
                    "totals.previous_savings_rate": prev_rate,
                    "totals.income": totals.get("income", 0),
                    "totals.expenses": totals.get("expenses", 0),
                    "totals.savings": totals.get("savings", 0),
                },
            )
        )

    top = metrics.get("top_transactions") or []
    if top:
        item = top[0]
        insights.append(
            FinancialInsight(
                id="largest-expense",
                type="anomaly",
                title="Largest expense this period",
                summary=f"{_money(item['amount'], currency)} at {item['merchant']} on {item['date']}.",
                explanation="This is the largest expense in the selected range.",
                severity="info",
                impact_score=35,
                metrics={"top_transactions.0.amount": item["amount"]},
                related_transaction_ids=[item["id"]],
                category=item.get("category"),
            )
        )

    if totals.get("income", 0) > 0:
        target_gap = from_cents(max(0, to_cents(totals["expenses"]) - to_cents(totals["income"] * 0.7)))
        if target_gap > 0:
            insights.append(
                FinancialInsight(
                    id="reduce-to-save",
                    type="recommendation",
                    title="A modest spending cut would lift savings",
                    summary=f"Reducing expenses by about {_money(target_gap, currency)} would move the savings rate closer to 30%.",
                    explanation="This uses the current income and expense totals only. It is a planning suggestion, not advice.",
                    severity="info",
                    impact_score=50,
                    metrics={
                        "recommendation.reduce_by": target_gap,
                        "totals.income": totals.get("income", 0),
                        "totals.expenses": totals.get("expenses", 0),
                    },
                    recommendation=f"You could consider reducing dining or shopping by about {_money(target_gap, currency)} this period.",
                )
            )

    unique: dict[str, FinancialInsight] = {}
    for item in insights:
        unique[item.id] = item
    ranked = sorted(unique.values(), key=lambda item: item.impact_score, reverse=True)
    return ranked


def rank_insights(insights: list[FinancialInsight], high: int = 5, support: int = 5) -> list[FinancialInsight]:
    ranked = sorted(insights, key=lambda item: (item.impact_score, item.confidence), reverse=True)
    return ranked[: high + support]


def fallback_summaries(metrics: dict) -> tuple[str, str]:
    totals = metrics.get("totals", {})
    currency = metrics.get("currency", "USD")
    change = totals.get("expense_change")
    change_text = "in line with the previous period"
    if change is not None and abs(change) >= 1:
        change_text = f"{'up' if change > 0 else 'down'} {abs(change):.1f}% versus the previous period"
    summary = (
        f"You spent {_money(totals.get('expenses', 0), currency)} this period, {change_text}. "
        f"Income was {_money(totals.get('income', 0), currency)} and the savings rate is {totals.get('savings_rate', 0):.0f}%."
    )
    health = "Watch spending closely." if (change or 0) > 10 or (totals.get("savings_rate") or 0) < 10 else "Spending looks manageable relative to income."
    if not metrics.get("totals", {}).get("expense_count"):
        summary = "There is not enough transaction data in this period to produce a detailed analysis."
        health = "Add expenses and income to unlock insights."
    return summary, health


def _money(amount: float, currency: str) -> str:
    symbol = "₹" if currency.upper() in {"INR", "RS"} else "$" if currency.upper() == "USD" else f"{currency} "
    return f"{symbol}{amount:,.2f}"


def _slug(value: str) -> str:
    return "".join(ch.lower() if ch.isalnum() else "_" for ch in value).strip("_")
