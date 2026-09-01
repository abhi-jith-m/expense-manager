from __future__ import annotations

from datetime import datetime, timezone
from threading import Lock
from uuid import uuid4

from app.schemas.insights import ConversationRecord, ConversationSummary, VioChatMessage

_lock = Lock()
_store: dict[str, dict[str, ConversationRecord]] = {}


def list_conversations(user_id: str) -> list[ConversationSummary]:
    with _lock:
        items = list((_store.get(user_id) or {}).values())
    items.sort(key=lambda item: item.updated_at, reverse=True)
    return [
        ConversationSummary(id=item.id, title=item.title, updated_at=item.updated_at, message_count=len(item.messages))
        for item in items
    ]


def get_conversation(user_id: str, conversation_id: str) -> ConversationRecord | None:
    with _lock:
        return (_store.get(user_id) or {}).get(conversation_id)


def create_conversation(user_id: str, title: str = "New conversation") -> ConversationRecord:
    now = datetime.now(timezone.utc)
    record = ConversationRecord(id=str(uuid4()), user_id=user_id, title=title, messages=[], created_at=now, updated_at=now)
    with _lock:
        _store.setdefault(user_id, {})[record.id] = record
    return record


def append_messages(user_id: str, conversation_id: str, messages: list[VioChatMessage], title: str | None = None) -> ConversationRecord:
    with _lock:
        user_store = _store.setdefault(user_id, {})
        record = user_store.get(conversation_id)
        if not record:
            now = datetime.now(timezone.utc)
            record = ConversationRecord(
                id=conversation_id,
                user_id=user_id,
                title=title or "New conversation",
                messages=[],
                created_at=now,
                updated_at=now,
            )
        updated = record.model_copy(deep=True)
        updated.messages.extend(messages)
        updated.updated_at = datetime.now(timezone.utc)
        if title:
            updated.title = title
        elif updated.title == "New conversation" and messages:
            first = next((item.content for item in messages if item.role == "user"), updated.title)
            updated.title = first[:56]
        user_store[conversation_id] = updated
        return updated


def delete_conversation(user_id: str, conversation_id: str) -> bool:
    with _lock:
        user_store = _store.get(user_id) or {}
        return user_store.pop(conversation_id, None) is not None


def history_pairs(user_id: str, conversation_id: str) -> list[dict[str, str]]:
    record = get_conversation(user_id, conversation_id)
    if not record:
        return []
    return [{"role": item.role, "content": item.content} for item in record.messages]
