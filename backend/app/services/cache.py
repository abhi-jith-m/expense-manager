from __future__ import annotations

import time
from threading import Lock

from app.core.config import get_settings
from app.schemas.insights import AnalyzeResponse

_lock = Lock()
_cache: dict[str, tuple[float, AnalyzeResponse]] = {}


def cache_key(user_id: str, start: str, end: str, data_version: str) -> str:
    return f"{user_id}:{start}:{end}:{data_version}"


def get_cached(key: str) -> AnalyzeResponse | None:
    with _lock:
        item = _cache.get(key)
        if not item:
            return None
        stored_at, value = item
        if time.time() - stored_at > get_settings().cache_ttl_seconds:
            _cache.pop(key, None)
            return None
        return value


def set_cached(key: str, value: AnalyzeResponse) -> None:
    with _lock:
        _cache[key] = (time.time(), value)


def invalidate_user(user_id: str) -> None:
    with _lock:
        for key in [item for item in _cache if item.startswith(f"{user_id}:")]:
            _cache.pop(key, None)
