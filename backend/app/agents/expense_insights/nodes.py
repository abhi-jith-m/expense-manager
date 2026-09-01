from __future__ import annotations

import logging
from datetime import date

from app.agents.expense_insights.prompts import (
    CHAT_SYSTEM_PROMPT,
    SYSTEM_PROMPT,
    build_chat_user_prompt,
    build_insight_user_prompt,
)
from app.agents.expense_insights.state import InsightState
from app.analytics.dates import parse_natural_range, resolve_preset
from app.analytics.engine import analyze_period
from app.analytics.fallback import build_fallback_insights, fallback_summaries, rank_insights
from app.core.config import get_settings
from app.schemas.finance import FinanceSnapshot
from app.schemas.insights import FinancialInsight, InsightResponse
from app.services.grounding import filter_grounded
from app.services.llm import get_llm_provider

logger = logging.getLogger(__name__)


def load_user_data(state: InsightState) -> InsightState:
    snapshot = FinanceSnapshot.model_validate(state["snapshot"])
    if any(item.user_id != state["user_id"] for item in snapshot.transactions):
        return {**state, "errors": [*state.get("errors", []), "snapshot_user_mismatch"], "progress": "blocked"}
    return {**state, "progress": "Analyzing transactions..."}


def calculate_metrics(state: InsightState) -> InsightState:
    snapshot = FinanceSnapshot.model_validate(state["snapshot"])
    result = analyze_period(
        snapshot,
        date.fromisoformat(state["start_date"]),
        date.fromisoformat(state["end_date"]),
        stable_threshold=get_settings().stable_change_threshold,
    )
    return {
        **state,
        "metrics": result["metrics"],
        "category_analysis": result["category_analysis"],
        "merchant_analysis": result["merchant_analysis"],
        "progress": "Calculating trends...",
    }


def analyze_spending(state: InsightState) -> InsightState:
    return {**state, "progress": "Checking budgets..."}


def detect_anomalies(state: InsightState) -> InsightState:
    metrics = state.get("metrics", {})
    return {**state, "anomaly_analysis": metrics.get("anomalies", []), "progress": "Finding unusual patterns..."}


def analyze_budgets(state: InsightState) -> InsightState:
    metrics = state.get("metrics", {})
    return {**state, "budget_analysis": metrics.get("budgets", [])}


def analyze_trends(state: InsightState) -> InsightState:
    metrics = state.get("metrics", {})
    return {**state, "trend_analysis": metrics.get("trends", {}), "progress": "Generating insights..."}


def prepare_insight_context(state: InsightState) -> InsightState:
    metrics = state.get("metrics", {})
    candidates = [item.model_dump() for item in build_fallback_insights(metrics)]
    context = {
        "period": metrics.get("period"),
        "totals": metrics.get("totals"),
        "categories": metrics.get("categories", [])[:8],
        "merchants": metrics.get("merchants", [])[:8],
        "budgets": metrics.get("budgets", []),
        "anomalies": metrics.get("anomalies", [])[:5],
        "behavior": metrics.get("behavior"),
        "trends": {
            "accelerating_overall": metrics.get("trends", {}).get("accelerating_overall"),
            "consecutive_overall": metrics.get("trends", {}).get("consecutive_overall"),
            "monthly_expenses": metrics.get("trends", {}).get("monthly_expenses"),
        },
        "top_transactions": metrics.get("top_transactions", []),
        "goals": metrics.get("goals", []),
        "accounts": metrics.get("accounts", []),
        "currency": metrics.get("currency"),
        "candidates": candidates,
    }
    return {**state, "insight_context": context, "candidate_insights": candidates}


async def generate_insights(state: InsightState) -> InsightState:
    provider = get_llm_provider()
    available = await provider.available()
    if not available:
        return {**state, "llm_available": False, "validation_ok": False, "used_fallback": True}
    try:
        response = await provider.generate_insights(
            SYSTEM_PROMPT,
            build_insight_user_prompt(state["insight_context"]),
        )
        return {
            **state,
            "llm_available": True,
            "insights": [item.model_copy(update={"source": "llm"}).model_dump() for item in response.insights],
            "overall_summary": response.overall_summary,
            "financial_health_summary": response.financial_health_summary,
            "used_fallback": False,
        }
    except Exception as exc:  # noqa: BLE001
        logger.info("event=llm_generate_failed error=%s", type(exc).__name__)
        return {
            **state,
            "llm_available": True,
            "validation_ok": False,
            "used_fallback": True,
            "errors": [*state.get("errors", []), "llm_generate_failed"],
        }


def validate_insights(state: InsightState) -> InsightState:
    if state.get("used_fallback") and not state.get("insights"):
        return {**state, "validation_ok": False, "retry_count": state.get("retry_count", 0) + 1}
    insights = [FinancialInsight.model_validate(item) for item in state.get("insights", [])]
    kept, rejected = filter_grounded(insights, state.get("metrics", {}))
    if rejected:
        logger.info("event=insight_validation_rejected count=%s", rejected)
    if not kept:
        return {
            **state,
            "validation_ok": False,
            "retry_count": state.get("retry_count", 0) + 1,
            "errors": [*state.get("errors", []), "grounding_failed"],
        }
    return {
        **state,
        "insights": [item.model_dump() for item in kept],
        "validation_ok": True,
    }


def apply_fallback(state: InsightState) -> InsightState:
    metrics = state.get("metrics", {})
    insights = build_fallback_insights(metrics)
    summary, health = fallback_summaries(metrics)
    return {
        **state,
        "insights": [item.model_dump() for item in insights],
        "overall_summary": summary,
        "financial_health_summary": health,
        "used_fallback": True,
        "validation_ok": True,
        "progress": "Using calculated insights...",
    }


def rank_insight_nodes(state: InsightState) -> InsightState:
    insights = [FinancialInsight.model_validate(item) for item in state.get("insights", [])]
    ranked = rank_insights(insights)
    if not state.get("overall_summary"):
        summary, health = fallback_summaries(state.get("metrics", {}))
        return {
            **state,
            "insights": [item.model_dump() for item in ranked],
            "overall_summary": summary,
            "financial_health_summary": health,
            "progress": "Done",
        }
    return {**state, "insights": [item.model_dump() for item in ranked], "progress": "Done"}


def route_after_validate(state: InsightState) -> str:
    if state.get("validation_ok"):
        return "rank_insights"
    if state.get("retry_count", 0) >= get_settings().llm_max_retries:
        return "fallback_insights"
    if state.get("used_fallback") and not state.get("llm_available"):
        return "fallback_insights"
    return "generate_insights"


def parse_question_dates(state: InsightState) -> InsightState:
    parsed = parse_natural_range(state.get("question", ""))
    if parsed:
        start, end = parsed
        return {**state, "start_date": start.isoformat(), "end_date": end.isoformat()}
    if not state.get("start_date") or not state.get("end_date"):
        start, end = resolve_preset("current_month")
        return {**state, "start_date": start.isoformat(), "end_date": end.isoformat()}
    return state


async def generate_chat_answer(state: InsightState) -> InsightState:
    provider = get_llm_provider()
    if not await provider.available():
        answer = _deterministic_answer(state.get("question", ""), state.get("metrics", {}), state.get("candidate_insights", []))
        history = [*state.get("history", []), {"role": "user", "content": state.get("question", "")}, {"role": "assistant", "content": answer}]
        return {**state, "answer": answer, "used_fallback": True, "llm_available": False, "history": history}
    try:
        text = await provider.generate_text(
            CHAT_SYSTEM_PROMPT,
            build_chat_user_prompt(
                state.get("question", ""),
                state.get("insight_context", {}),
                state.get("history", []),
                state.get("page"),
            ),
        )
        history = [*state.get("history", []), {"role": "user", "content": state.get("question", "")}, {"role": "assistant", "content": text}]
        return {**state, "answer": text, "llm_available": True, "used_fallback": False, "history": history}
    except Exception:  # noqa: BLE001
        answer = _deterministic_answer(state.get("question", ""), state.get("metrics", {}), state.get("candidate_insights", []))
        history = [*state.get("history", []), {"role": "user", "content": state.get("question", "")}, {"role": "assistant", "content": answer}]
        return {**state, "answer": answer, "used_fallback": True, "history": history}


def _deterministic_answer(question: str, metrics: dict, candidates: list[dict]) -> str:
    lowered = question.lower()
    totals = metrics.get("totals", {})
    currency = metrics.get("currency", "USD")
    if "biggest" in lowered or "largest" in lowered:
        top = (metrics.get("top_transactions") or [None])[0]
        if not top:
            return "There are no expenses in this period."
        return f"Your largest expense was {top['amount']:.2f} {currency} at {top['merchant']} on {top['date']}."
    if "food" in lowered or "dining" in lowered:
        match = next((row for row in metrics.get("categories", []) if "food" in row["name"].lower()), None)
        if not match:
            return "There is no food category spending in this period."
        return f"Food spending is {match['current_spending']:.2f} {currency} across {match['transaction_count']} transactions."
    if "overspend" in lowered or "budget" in lowered:
        risky = [row for row in metrics.get("budgets", []) if row["status"] != "healthy"]
        if not risky:
            return "No budget is currently exceeded or projected to exceed its limit."
        row = risky[0]
        return f"{row['name']} is {row['percentage_used']:.0f}% used with a projected spend of {row['projected_month_end_spend']:.2f} {currency}."
    if "reduc" in lowered:
        cats = metrics.get("categories", [])[:3]
        if not cats:
            return "There is not enough spending history to suggest a reduction."
        names = ", ".join(item["name"] for item in cats)
        return f"The highest-impact categories to review are {names}. You could consider trimming the largest of these first."
    if "improv" in lowered or "better" in lowered:
        change = totals.get("expense_change")
        if change is None:
            return "There is not enough prior-period data to judge improvement."
        return f"Spending is {'down' if change < 0 else 'up'} {abs(change):.1f}% versus the previous period. Savings rate is {totals.get('savings_rate', 0):.0f}%."
    if candidates:
        return candidates[0]["summary"]
    if not totals.get("expense_count"):
        return "There is insufficient data in this period to answer that."
    return f"You spent {totals.get('expenses', 0):.2f} {currency} this period, with a {totals.get('savings_rate', 0):.0f}% savings rate."
