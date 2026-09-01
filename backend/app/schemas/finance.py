from __future__ import annotations

from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class CamelModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")


class TransactionIn(CamelModel):
    id: str
    user_id: str = Field(alias="userId")
    type: Literal["expense", "income", "transfer"]
    amount: float
    currency: str = "USD"
    category_id: str | None = Field(default=None, alias="categoryId")
    account_id: str = Field(alias="accountId")
    to_account_id: str | None = Field(default=None, alias="toAccountId")
    merchant: str = ""
    description: str = ""
    notes: str = ""
    date: date
    payment_method: str = Field(default="card", alias="paymentMethod")
    tags: list[str] = Field(default_factory=list)
    recurring_id: str | None = Field(default=None, alias="recurringId")
    is_sample: bool = Field(default=False, alias="isSample")
    updated_at: str | None = Field(default=None, alias="updatedAt")


class CategoryIn(CamelModel):
    id: str
    user_id: str = Field(alias="userId")
    name: str
    kind: Literal["expense", "income"] = "expense"
    parent_id: str | None = Field(default=None, alias="parentId")


class AccountIn(CamelModel):
    id: str
    user_id: str = Field(alias="userId")
    name: str
    type: str = "bank"
    opening_balance: float = Field(default=0, alias="openingBalance")
    currency: str = "USD"
    status: str = "active"
    updated_at: str | None = Field(default=None, alias="updatedAt")


class BudgetIn(CamelModel):
    id: str
    user_id: str = Field(alias="userId")
    name: str
    category_id: str | None = Field(default=None, alias="categoryId")
    limit_amount: float = Field(alias="limitAmount")
    period: str = "monthly"
    start_date: date = Field(alias="startDate")
    end_date: date | None = Field(default=None, alias="endDate")
    alert_threshold: float = Field(default=80, alias="alertThreshold")
    updated_at: str | None = Field(default=None, alias="updatedAt")


class GoalIn(CamelModel):
    id: str
    user_id: str = Field(alias="userId")
    name: str
    target_amount: float = Field(alias="targetAmount")
    current_amount: float = Field(alias="currentAmount")
    deadline: date | None = None
    updated_at: str | None = Field(default=None, alias="updatedAt")


class RecurringIn(CamelModel):
    id: str
    user_id: str = Field(alias="userId")
    type: Literal["expense", "income", "transfer"] = "expense"
    amount: float
    merchant: str = ""
    category_id: str | None = Field(default=None, alias="categoryId")
    frequency: str = "monthly"
    interval: int = 1
    active: bool = True
    updated_at: str | None = Field(default=None, alias="updatedAt")


class FinanceSnapshot(CamelModel):
    currency: str = "USD"
    transactions: list[TransactionIn] = Field(default_factory=list)
    categories: list[CategoryIn] = Field(default_factory=list)
    accounts: list[AccountIn] = Field(default_factory=list)
    budgets: list[BudgetIn] = Field(default_factory=list)
    goals: list[GoalIn] = Field(default_factory=list)
    recurring: list[RecurringIn] = Field(default_factory=list)
