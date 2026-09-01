from __future__ import annotations

import httpx

from app.core.config import get_settings
from app.schemas.finance import (
    AccountIn,
    BudgetIn,
    CategoryIn,
    FinanceSnapshot,
    GoalIn,
    RecurringIn,
    TransactionIn,
)


async def load_snapshot_from_supabase(user_id: str, access_token: str) -> FinanceSnapshot:
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_api_key:
        raise RuntimeError("Supabase is not configured")
    headers = {
        "Authorization": f"Bearer {access_token}",
        "apikey": settings.supabase_api_key,
        "Prefer": "return=representation",
    }
    base = settings.supabase_url.rstrip("/") + "/rest/v1"

    async with httpx.AsyncClient(timeout=20) as client:
        transactions = await _table(client, f"{base}/transactions", headers, user_id)
        categories = await _table(client, f"{base}/categories", headers, user_id)
        accounts = await _table(client, f"{base}/accounts", headers, user_id)
        budgets = await _table(client, f"{base}/budgets", headers, user_id)
        goals = await _table(client, f"{base}/goals", headers, user_id)
        recurring = await _table(client, f"{base}/recurring_transactions", headers, user_id)

    return FinanceSnapshot(
        transactions=[TransactionIn.model_validate(_snake_to_camel(row)) for row in transactions],
        categories=[CategoryIn.model_validate(_snake_to_camel(row)) for row in categories],
        accounts=[AccountIn.model_validate(_snake_to_camel(row)) for row in accounts],
        budgets=[BudgetIn.model_validate(_snake_to_camel(row)) for row in budgets],
        goals=[GoalIn.model_validate(_snake_to_camel(row)) for row in goals],
        recurring=[RecurringIn.model_validate(_snake_to_camel(row)) for row in recurring],
    )


async def _table(client: httpx.AsyncClient, url: str, headers: dict[str, str], user_id: str) -> list[dict]:
    response = await client.get(url, headers=headers, params={"user_id": f"eq.{user_id}", "select": "*"})
    response.raise_for_status()
    return response.json()


def _snake_to_camel(row: dict) -> dict:
    mapping = {
        "user_id": "userId",
        "category_id": "categoryId",
        "account_id": "accountId",
        "to_account_id": "toAccountId",
        "payment_method": "paymentMethod",
        "recurring_id": "recurringId",
        "is_sample": "isSample",
        "updated_at": "updatedAt",
        "opening_balance": "openingBalance",
        "limit_amount": "limitAmount",
        "start_date": "startDate",
        "end_date": "endDate",
        "alert_threshold": "alertThreshold",
        "target_amount": "targetAmount",
        "current_amount": "currentAmount",
        "parent_id": "parentId",
    }
    return {mapping.get(key, key): value for key, value in row.items()}
