from __future__ import annotations

from fastapi import Header, HTTPException

from app.core.security import parse_user_id
from app.repositories.finance import load_snapshot_from_supabase
from app.schemas.finance import FinanceSnapshot


async def require_user(
    authorization: str | None = Header(default=None),
    x_user_id: str | None = Header(default=None),
) -> str:
    return parse_user_id(authorization, x_user_id)


async def resolve_snapshot(
    user_id: str,
    snapshot: FinanceSnapshot | None,
    authorization: str | None,
) -> FinanceSnapshot:
    if snapshot is not None:
        if any(tx.user_id != user_id for tx in snapshot.transactions):
            raise HTTPException(status_code=403, detail="Snapshot does not belong to the authenticated user")
        return snapshot
    token = (authorization or "").removeprefix("Bearer ").removeprefix("bearer ").strip()
    if not token or token.startswith("local."):
        raise HTTPException(status_code=400, detail="A finance snapshot is required in local mode")
    loaded = await load_snapshot_from_supabase(user_id, token)
    if any(tx.user_id != user_id for tx in loaded.transactions):
        raise HTTPException(status_code=403, detail="Forbidden")
    return loaded
