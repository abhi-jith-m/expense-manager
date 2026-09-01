from __future__ import annotations

from datetime import datetime, timezone
from threading import Lock
from uuid import uuid4

from app.schemas.insights import AnalyzeResponse, FeedbackRequest, FinancialInsight

_lock = Lock()
_analyses: dict[str, list[AnalyzeResponse]] = {}
_feedback: list[dict] = []


def save_analysis(user_id: str, response: AnalyzeResponse) -> AnalyzeResponse:
    with _lock:
        _analyses.setdefault(user_id, []).insert(0, response)
        _analyses[user_id] = _analyses[user_id][:20]
    return response


def latest_analysis(user_id: str) -> AnalyzeResponse | None:
    with _lock:
        items = _analyses.get(user_id) or []
        return items[0] if items else None


def history(user_id: str) -> list[AnalyzeResponse]:
    with _lock:
        return list(_analyses.get(user_id) or [])


def save_feedback(user_id: str, insight_id: str, payload: FeedbackRequest) -> dict:
    record = {
        "id": str(uuid4()),
        "user_id": user_id,
        "insight_id": insight_id,
        "feedback": payload.feedback,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    with _lock:
        _feedback.append(record)
    return record


def user_owns_insight(user_id: str, insight_id: str) -> bool:
    with _lock:
        for analysis in _analyses.get(user_id) or []:
            if any(item.id == insight_id for item in analysis.insights):
                return True
    return False


def find_insight(user_id: str, insight_id: str) -> FinancialInsight | None:
    with _lock:
        for analysis in _analyses.get(user_id) or []:
            for item in analysis.insights:
                if item.id == insight_id:
                    return item
    return None
