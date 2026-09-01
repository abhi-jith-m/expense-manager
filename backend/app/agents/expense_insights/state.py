from __future__ import annotations

from typing import Any, TypedDict


class InsightState(TypedDict, total=False):
    user_id: str
    start_date: str
    end_date: str
    snapshot: dict[str, Any]
    metrics: dict[str, Any]
    category_analysis: list[dict[str, Any]]
    merchant_analysis: list[dict[str, Any]]
    trend_analysis: dict[str, Any]
    anomaly_analysis: list[dict[str, Any]]
    budget_analysis: list[dict[str, Any]]
    insight_context: dict[str, Any]
    candidate_insights: list[dict[str, Any]]
    insights: list[dict[str, Any]]
    overall_summary: str
    financial_health_summary: str
    errors: list[str]
    retry_count: int
    validation_ok: bool
    used_fallback: bool
    llm_available: bool
    question: str
    answer: str
    conversation_id: str
    page: str
    history: list[dict[str, str]]
    progress: str
