from datetime import date

import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings


@pytest.fixture(autouse=True)
def disable_remote_llm(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("NVIDIA_API_KEY", "")
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()

from app.main import app
from app.schemas.finance import (
    AccountIn,
    BudgetIn,
    CategoryIn,
    FinanceSnapshot,
    GoalIn,
    RecurringIn,
    TransactionIn,
)


@pytest.fixture
def user_id() -> str:
    return "user-1"


@pytest.fixture
def snapshot(user_id: str) -> FinanceSnapshot:
    food = CategoryIn(id="cat-food", userId=user_id, name="Food", kind="expense")
    transport = CategoryIn(id="cat-transport", userId=user_id, name="Transport", kind="expense")
    salary = CategoryIn(id="cat-salary", userId=user_id, name="Salary", kind="income")
    account = AccountIn(id="acc-1", userId=user_id, name="Checking", type="bank", openingBalance=2000)
    txs = [
        TransactionIn(id="t1", userId=user_id, type="income", amount=50000, categoryId="cat-salary", accountId="acc-1", merchant="Employer", date=date(2026, 8, 1), paymentMethod="bank_transfer"),
        TransactionIn(id="t2", userId=user_id, type="expense", amount=400, categoryId="cat-food", accountId="acc-1", merchant="Cafe", date=date(2026, 8, 3), paymentMethod="card"),
        TransactionIn(id="t3", userId=user_id, type="expense", amount=350, categoryId="cat-food", accountId="acc-1", merchant="Cafe", date=date(2026, 8, 10), paymentMethod="card"),
        TransactionIn(id="t4", userId=user_id, type="expense", amount=8200, categoryId="cat-transport", accountId="acc-1", merchant="Metro", date=date(2026, 8, 12), paymentMethod="upi"),
        TransactionIn(id="t5", userId=user_id, type="income", amount=50000, categoryId="cat-salary", accountId="acc-1", merchant="Employer", date=date(2026, 9, 1), paymentMethod="bank_transfer"),
        TransactionIn(id="t6", userId=user_id, type="expense", amount=1200, categoryId="cat-food", accountId="acc-1", merchant="Zomato", date=date(2026, 9, 2), paymentMethod="upi"),
        TransactionIn(id="t7", userId=user_id, type="expense", amount=900, categoryId="cat-food", accountId="acc-1", merchant="Swiggy", date=date(2026, 9, 4), paymentMethod="upi"),
        TransactionIn(id="t8", userId=user_id, type="expense", amount=18500, categoryId="cat-food", accountId="acc-1", merchant="XYZ", date=date(2026, 9, 6), paymentMethod="card"),
        TransactionIn(id="t9", userId=user_id, type="expense", amount=6100, categoryId="cat-transport", accountId="acc-1", merchant="Metro", date=date(2026, 9, 8), paymentMethod="upi"),
        TransactionIn(id="t10", userId=user_id, type="expense", amount=499, categoryId="cat-food", accountId="acc-1", merchant="Netflix", date=date(2026, 8, 15), paymentMethod="card"),
        TransactionIn(id="t11", userId=user_id, type="expense", amount=499, categoryId="cat-food", accountId="acc-1", merchant="Netflix", date=date(2026, 9, 15), paymentMethod="card"),
    ]
    return FinanceSnapshot(
        currency="INR",
        transactions=txs,
        categories=[food, transport, salary],
        accounts=[account],
        budgets=[
            BudgetIn(
                id="b1",
                userId=user_id,
                name="Food budget",
                categoryId="cat-food",
                limitAmount=10000,
                period="monthly",
                startDate=date(2026, 9, 1),
            )
        ],
        goals=[GoalIn(id="g1", userId=user_id, name="Emergency", targetAmount=6000, currentAmount=1450)],
        recurring=[RecurringIn(id="r1", userId=user_id, type="expense", amount=499, merchant="Netflix", categoryId="cat-food")],
    )


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)
