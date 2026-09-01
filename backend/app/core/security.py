from __future__ import annotations

from functools import lru_cache

import httpx
from fastapi import Header, HTTPException
from jose import JWTError, jwt

from app.core.config import get_settings


def parse_user_id(
    authorization: str | None = Header(default=None),
    x_user_id: str | None = Header(default=None),
) -> str:
    settings = get_settings()
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
        if token.startswith("local."):
            if not settings.allow_local_auth:
                raise HTTPException(status_code=401, detail="Local auth is disabled")
            user_id = token.removeprefix("local.")
            if not user_id:
                raise HTTPException(status_code=401, detail="Invalid local token")
            return user_id
        return _decode_supabase_token(token)
    if settings.allow_local_auth and x_user_id:
        return x_user_id
    raise HTTPException(status_code=401, detail="Missing credentials")


def _decode_supabase_token(token: str) -> str:
    settings = get_settings()
    try:
        if settings.supabase_jwks_url:
            payload = _decode_with_jwks(token, settings.supabase_jwks_url)
        elif settings.supabase_jwt_secret:
            payload = jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
                options={"verify_aud": False},
            )
        else:
            payload = jwt.get_unverified_claims(token)
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token missing subject")
    return str(user_id)


def _decode_with_jwks(token: str, jwks_url: str) -> dict:
    header = jwt.get_unverified_header(token)
    key = _jwk_for_kid(jwks_url, header.get("kid"))
    algorithms = [header["alg"]] if header.get("alg") else ["ES256", "RS256"]
    return jwt.decode(
        token,
        key,
        algorithms=algorithms,
        audience="authenticated",
        options={"verify_aud": False},
    )


@lru_cache(maxsize=4)
def _load_jwks(jwks_url: str) -> dict:
    response = httpx.get(jwks_url, timeout=10)
    response.raise_for_status()
    return response.json()


def _jwk_for_kid(jwks_url: str, kid: str | None) -> dict:
    jwks = _load_jwks(jwks_url)
    keys = jwks.get("keys") or []
    if kid:
        for key in keys:
            if key.get("kid") == kid:
                return key
        _load_jwks.cache_clear()
        jwks = _load_jwks(jwks_url)
        keys = jwks.get("keys") or []
        for key in keys:
            if key.get("kid") == kid:
                return key
    if len(keys) == 1:
        return keys[0]
    raise JWTError("No matching signing key")
