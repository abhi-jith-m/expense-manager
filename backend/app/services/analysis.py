from __future__ import annotations

import logging
from datetime import date, datetime, timezone
from uuid import uuid4

from app.agents.expense_insights.chat_graph import build_chat_graph
from app.agents.expense_insights.graph import build_insight_graph
from app.analytics.dates import previous_period, resolve_preset
from app.core.logging import timed
from app.repositories.conversations import append_messages, history_pairs
from app.repositories.insights import save_analysis
from app.schemas.finance import FinanceSnapshot
from app.schemas.insights import (
    AnalysisPeriod,
    AnalyzeRequest,
    AnalyzeResponse,
    ChatRequest,
    ChatResponse,
    FinancialInsight,
    VioChatMessage,
)
from app.services.vio_payload import build_assistant_message, empty_data_message
from app.services.cache import cache_key, get_cached, set_cached

logger = logging.getLogger(__name__)


def resolve_range(request: AnalyzeRequest | ChatRequest) -> tuple[date, date]:
    if request.start_date and request.end_date:
        return request.start_date, request.end_date
    preset = getattr(request, "preset", "current_month")
    return resolve_preset(preset)


async def run_analysis(user_id: str, request: AnalyzeRequest, snapshot: FinanceSnapshot) -> AnalyzeResponse:
    start, end = resolve_range(request)
    version = request.data_version or _snapshot_version(snapshot)
    key = cache_key(user_id, start.isoformat(), end.isoformat(), version)
    cached = get_cached(key)
    if cached:
        return cached

    graph = build_insight_graph()
    initial = {
        "user_id": user_id,
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "snapshot": snapshot.model_dump(mode="json"),
        "errors": [],
        "retry_count": 0,
        "validation_ok": False,
        "used_fallback": False,
        "llm_available": False,
        "insights": [],
    }
    with timed(logger, "insight_analysis", user_id=user_id):
        final = await graph.ainvoke(initial)
    comparison_start, comparison_end = previous_period(start, end)
    response = AnalyzeResponse(
        summary=final.get("overall_summary") or "",
        financial_health_summary=final.get("financial_health_summary") or "",
        insights=[FinancialInsight.model_validate(item) for item in final.get("insights", [])],
        metrics=final.get("metrics") or {},
        generated_at=datetime.now(timezone.utc),
        analysis_period=AnalysisPeriod(
            start=start,
            end=end,
            comparison_start=comparison_start,
            comparison_end=comparison_end,
            label=f"{start.isoformat()} – {end.isoformat()}",
        ),
        used_fallback=bool(final.get("used_fallback")),
        llm_available=bool(final.get("llm_available")),
    )
    set_cached(key, response)
    save_analysis(user_id, response)
    return response


async def run_chat(user_id: str, request: ChatRequest, snapshot: FinanceSnapshot) -> ChatResponse:
    start, end = resolve_range(request)
    conversation_id = request.conversation_id or str(uuid4())
    if not snapshot.transactions:
        assistant = empty_data_message()
        user_msg = VioChatMessage(
            id=str(uuid4()),
            role="user",
            content=request.message,
            created_at=datetime.now(timezone.utc),
        )
        append_messages(user_id, conversation_id, [user_msg, assistant], title=request.message[:56])
        return ChatResponse(
            conversation_id=conversation_id,
            answer=assistant.content,
            message=assistant,
            empty_data=True,
            used_fallback=True,
        )

    graph = build_chat_graph()
    initial = {
        "user_id": user_id,
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "snapshot": snapshot.model_dump(mode="json"),
        "question": request.message,
        "conversation_id": conversation_id,
        "page": request.page or "",
        "history": history_pairs(user_id, conversation_id),
        "errors": [],
        "insights": [],
    }
    with timed(logger, "insight_chat", user_id=user_id):
        final = await graph.ainvoke(initial, config={"configurable": {"thread_id": f"{user_id}:{conversation_id}"}})
    insights = [FinancialInsight.model_validate(item) for item in final.get("candidate_insights", [])[:3]]
    answer = final.get("answer") or "There is not enough data to answer that."
    assistant = build_assistant_message(request.message, answer, final.get("metrics") or {}, insights)
    user_msg = VioChatMessage(
        id=str(uuid4()),
        role="user",
        content=request.message,
        created_at=datetime.now(timezone.utc),
    )
    append_messages(user_id, conversation_id, [user_msg, assistant], title=request.message[:56])
    return ChatResponse(
        conversation_id=conversation_id,
        answer=answer,
        message=assistant,
        insights=insights,
        metrics=final.get("metrics") or {},
        used_fallback=bool(final.get("used_fallback")),
        empty_data=False,
        citations=[assistant.grounding] if assistant.grounding else [],
    )


def _snapshot_version(snapshot: FinanceSnapshot) -> str:
    stamps = []
    for collection in (
        snapshot.transactions,
        snapshot.budgets,
        snapshot.accounts,
        snapshot.categories,
        snapshot.goals,
    ):
        for item in collection:
            stamps.append(getattr(item, "updated_at", None) or "")
    stamps.append(str(len(snapshot.transactions)))
    return max(stamps) if stamps else "empty"
