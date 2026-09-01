from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from app.schemas.insights import ChatMetric, ChartSeries, FinancialInsight, RelatedTransaction, VioChatMessage


def empty_data_message() -> VioChatMessage:
    return VioChatMessage(
        id=str(uuid4()),
        role="assistant",
        content="I don't have enough transaction data yet. Add a few transactions or import your history, and I'll start finding patterns for you.",
        created_at=datetime.now(timezone.utc),
        follow_ups=[],
        grounding=None,
    )


def build_assistant_message(
    question: str,
    answer: str,
    metrics: dict,
    insights: list[FinancialInsight],
) -> VioChatMessage:
    period = metrics.get("period") or {}
    totals = metrics.get("totals") or {}
    count = int(totals.get("expense_count") or 0)
    start = period.get("start")
    end = period.get("end")
    grounding = None
    if start and end:
        grounding = f"Based on your transactions · {start}–{end}"
    elif count:
        grounding = f"Based on {count} transactions"

    return VioChatMessage(
        id=str(uuid4()),
        role="assistant",
        content=answer,
        insights=insights[:3],
        metrics=_metrics_for_question(question, metrics),
        related_transactions=_related_transactions(question, metrics),
        chart=_chart_for_question(question, metrics),
        follow_ups=_follow_ups(question, metrics),
        grounding=grounding,
        created_at=datetime.now(timezone.utc),
    )


def _metrics_for_question(question: str, metrics: dict) -> list[ChatMetric]:
    lowered = question.lower()
    rows: list[ChatMetric] = []
    categories = metrics.get("categories") or []
    if any(token in lowered for token in ("food", "dining", "category", "spend", "cut", "increase", "most")):
        for row in categories[:3]:
            rows.append(
                ChatMetric(
                    id=row.get("id") or row.get("name"),
                    label=row.get("name"),
                    value=row.get("current_spending") or 0,
                    previous=row.get("previous_spending"),
                    change=row.get("percentage_change"),
                )
            )
    totals = metrics.get("totals") or {}
    if "save" in lowered or "how am i" in lowered or "doing" in lowered:
        rows.insert(
            0,
            ChatMetric(
                id="savings-rate",
                label="Savings rate",
                value=totals.get("savings_rate") or 0,
                previous=totals.get("previous_savings_rate"),
                change=None,
                unit="percent",
            ),
        )
    return rows[:4]


def _related_transactions(question: str, metrics: dict) -> list[RelatedTransaction]:
    lowered = question.lower()
    if not any(token in lowered for token in ("biggest", "largest", "transaction", "unusual", "amazon", "shop", "food", "dine")):
        top = metrics.get("top_transactions") or []
        if "why" in lowered or "increase" in lowered:
            return [
                RelatedTransaction(
                    id=item["id"],
                    merchant=item.get("merchant") or "Untitled",
                    amount=item.get("amount") or 0,
                    date=item.get("date") or "",
                    category=item.get("category"),
                )
                for item in top[:3]
            ]
        return []
    source = metrics.get("top_transactions") or []
    return [
        RelatedTransaction(
            id=item["id"],
            merchant=item.get("merchant") or "Untitled",
            amount=item.get("amount") or 0,
            date=item.get("date") or "",
            category=item.get("category"),
        )
        for item in source[:3]
    ]


def _chart_for_question(question: str, metrics: dict) -> ChartSeries | None:
    lowered = question.lower()
    if any(token in lowered for token in ("6 month", "trend", "over time", "changed", "compare")):
        series = (metrics.get("trends") or {}).get("monthly_expenses") or []
        if series:
            return ChartSeries(
                type="line",
                points=[{"label": item.get("start", "")[5:7], "value": item.get("expenses") or 0} for item in series],
            )
    if any(token in lowered for token in ("categor", "where", "most")):
        cats = metrics.get("categories") or []
        if cats:
            return ChartSeries(
                type="bar",
                points=[{"label": item["name"], "value": item.get("current_spending") or 0} for item in cats[:5]],
            )
    return None


def _follow_ups(question: str, metrics: dict) -> list[str]:
    lowered = question.lower()
    if "food" in lowered or "dining" in lowered:
        return ["Why did it increase?", "Show top restaurants", "How can I reduce it?"]
    if "budget" in lowered:
        return ["Which budget is closest to its limit?", "Compare with last month"]
    if "subscription" in lowered:
        return ["How much do they cost in total?", "Which ones look unused?"]
    if "increase" in lowered or "more" in lowered:
        cats = [item["name"] for item in (metrics.get("categories") or [])[:2]]
        extra = f"What about {cats[0]}?" if cats else "Where can I cut spending?"
        return ["What about food?", extra, "Show my biggest expenses"]
    return ["Where can I cut spending?", "Am I on track with my budget?", "How can I save more?"]
