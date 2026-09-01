from __future__ import annotations

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, HTTPException
from fastapi.responses import StreamingResponse

from app.api.deps import require_user, resolve_snapshot
from app.repositories.conversations import create_conversation, delete_conversation, get_conversation, list_conversations
from app.repositories.insights import find_insight, history, latest_analysis, save_feedback, user_owns_insight
from app.schemas.insights import (
    AnalyzeRequest,
    AnalyzeResponse,
    ChatRequest,
    ChatResponse,
    ConversationRecord,
    ConversationSummary,
    FeedbackRequest,
)
from app.services.analysis import resolve_range, run_analysis, run_chat
from app.services.cache import invalidate_user

router = APIRouter(prefix="/api/insights", tags=["insights"])


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(
    payload: AnalyzeRequest,
    user_id: str = Depends(require_user),
    authorization: str | None = Header(default=None),
) -> AnalyzeResponse:
    snapshot = await resolve_snapshot(user_id, payload.snapshot, authorization)
    return await run_analysis(user_id, payload, snapshot)


@router.post("/analyze/stream")
async def analyze_stream(
    payload: AnalyzeRequest,
    user_id: str = Depends(require_user),
    authorization: str | None = Header(default=None),
) -> StreamingResponse:
    snapshot = await resolve_snapshot(user_id, payload.snapshot, authorization)

    async def events():
        stages = [
            "Analyzing transactions...",
            "Calculating trends...",
            "Checking budgets...",
            "Finding unusual patterns...",
            "Generating insights...",
        ]
        for stage in stages:
            yield f"event: progress\ndata: {json.dumps({'message': stage})}\n\n"
        result = await run_analysis(user_id, payload, snapshot)
        yield f"event: complete\ndata: {result.model_dump_json()}\n\n"

    return StreamingResponse(events(), media_type="text/event-stream")


@router.post("/chat", response_model=ChatResponse)
async def chat(
    payload: ChatRequest,
    user_id: str = Depends(require_user),
    authorization: str | None = Header(default=None),
) -> ChatResponse:
    snapshot = await resolve_snapshot(user_id, payload.snapshot, authorization)
    return await run_chat(user_id, payload, snapshot)


@router.post("/chat/stream")
async def chat_stream(
    payload: ChatRequest,
    user_id: str = Depends(require_user),
    authorization: str | None = Header(default=None),
) -> StreamingResponse:
    snapshot = await resolve_snapshot(user_id, payload.snapshot, authorization)

    async def events():
        for stage in (
            "Analyzing your spending...",
            "Checking spending trends...",
            "Looking for unusual patterns...",
            "Preparing your insights...",
        ):
            yield f"event: progress\ndata: {json.dumps({'message': stage})}\n\n"
        result = await run_chat(user_id, payload, snapshot)
        yield f"event: complete\ndata: {result.model_dump_json()}\n\n"

    return StreamingResponse(events(), media_type="text/event-stream")


@router.get("/conversations", response_model=list[ConversationSummary])
async def conversations(user_id: str = Depends(require_user)) -> list[ConversationSummary]:
    return list_conversations(user_id)


@router.post("/conversations", response_model=ConversationRecord)
async def new_conversation(user_id: str = Depends(require_user)) -> ConversationRecord:
    return create_conversation(user_id)


@router.get("/conversations/{conversation_id}", response_model=ConversationRecord)
async def conversation_detail(conversation_id: str, user_id: str = Depends(require_user)) -> ConversationRecord:
    record = get_conversation(user_id, conversation_id)
    if not record:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return record


@router.delete("/conversations/{conversation_id}")
async def remove_conversation(conversation_id: str, user_id: str = Depends(require_user)) -> dict:
    if not delete_conversation(user_id, conversation_id):
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"ok": True}


@router.get("/latest", response_model=AnalyzeResponse | None)
async def latest(user_id: str = Depends(require_user)) -> AnalyzeResponse | None:
    return latest_analysis(user_id)


@router.get("/history", response_model=list[AnalyzeResponse])
async def analysis_history(user_id: str = Depends(require_user)) -> list[AnalyzeResponse]:
    return history(user_id)


@router.get("/health")
async def health() -> dict:
    start, end = resolve_range(AnalyzeRequest())
    return {"ok": True, "default_period": {"start": start.isoformat(), "end": end.isoformat()}}


@router.post("/{insight_id}/feedback")
async def feedback(
    insight_id: str,
    payload: FeedbackRequest,
    user_id: str = Depends(require_user),
) -> dict:
    if not user_owns_insight(user_id, insight_id):
        raise HTTPException(status_code=404, detail="Insight not found")
    return save_feedback(user_id, insight_id, payload)


@router.get("/{insight_id}")
async def insight_detail(insight_id: str, user_id: str = Depends(require_user)):
    item = find_insight(user_id, insight_id)
    if not item:
        raise HTTPException(status_code=404, detail="Insight not found")
    return item


@router.post("/cache/invalidate")
async def invalidate(user_id: str = Depends(require_user)) -> dict:
    invalidate_user(user_id)
    return {"ok": True, "at": datetime.now(timezone.utc).isoformat()}
