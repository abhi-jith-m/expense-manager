from __future__ import annotations

from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

from app.schemas.finance import FinanceSnapshot

InsightType = Literal[
    "spending",
    "trend",
    "anomaly",
    "budget",
    "behavior",
    "savings",
    "recurring",
    "recommendation",
]
Severity = Literal["info", "positive", "warning", "critical"]
PeriodPreset = Literal[
    "current_week",
    "previous_week",
    "current_month",
    "previous_month",
    "last_3_months",
    "last_6_months",
    "current_year",
    "previous_year",
    "custom",
]


class FinancialInsight(BaseModel):
    id: str
    type: InsightType
    title: str
    summary: str
    explanation: str
    severity: Severity
    confidence: float = 0.8
    impact_score: float = 0
    metrics: dict[str, Any] = Field(default_factory=dict)
    category: str | None = None
    related_transaction_ids: list[str] = Field(default_factory=list)
    recommendation: str | None = None
    source: Literal["deterministic", "llm"] = "deterministic"


class InsightResponse(BaseModel):
    insights: list[FinancialInsight]
    overall_summary: str
    financial_health_summary: str


class AnalyzeRequest(BaseModel):
    start_date: date | None = None
    end_date: date | None = None
    preset: PeriodPreset = "current_month"
    snapshot: FinanceSnapshot | None = None
    data_version: str | None = None
    currency: str | None = None


class AnalysisPeriod(BaseModel):
    start: date
    end: date
    comparison_start: date
    comparison_end: date
    label: str


class AnalyzeResponse(BaseModel):
    summary: str
    financial_health_summary: str
    insights: list[FinancialInsight]
    metrics: dict[str, Any]
    generated_at: datetime
    analysis_period: AnalysisPeriod
    used_fallback: bool = False
    llm_available: bool = False


class ChatRequest(BaseModel):
    message: str
    conversation_id: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    snapshot: FinanceSnapshot | None = None
    page: str | None = None


class RelatedTransaction(BaseModel):
    id: str
    merchant: str
    amount: float
    date: str
    category: str | None = None


class ChatMetric(BaseModel):
    id: str
    label: str
    value: float
    previous: float | None = None
    change: float | None = None
    unit: str = "money"


class ChartSeries(BaseModel):
    type: Literal["line", "bar"] = "bar"
    points: list[dict[str, Any]] = Field(default_factory=list)


class VioChatMessage(BaseModel):
    id: str
    role: Literal["user", "assistant"]
    content: str
    insights: list[FinancialInsight] = Field(default_factory=list)
    metrics: list[ChatMetric] = Field(default_factory=list)
    related_transactions: list[RelatedTransaction] = Field(default_factory=list)
    chart: ChartSeries | None = None
    follow_ups: list[str] = Field(default_factory=list)
    grounding: str | None = None
    created_at: datetime


class ConversationRecord(BaseModel):
    id: str
    user_id: str
    title: str
    messages: list[VioChatMessage] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class ConversationSummary(BaseModel):
    id: str
    title: str
    updated_at: datetime
    message_count: int = 0


class ChatResponse(BaseModel):
    conversation_id: str
    answer: str
    message: VioChatMessage | None = None
    insights: list[FinancialInsight] = Field(default_factory=list)
    metrics: dict[str, Any] = Field(default_factory=dict)
    used_fallback: bool = False
    empty_data: bool = False
    citations: list[str] = Field(default_factory=list)


class FeedbackRequest(BaseModel):
    feedback: Literal["helpful", "not_helpful", "not_relevant", "already_know"]
