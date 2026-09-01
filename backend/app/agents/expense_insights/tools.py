from __future__ import annotations

from typing import Any


def tool_get_spending_summary(metrics: dict[str, Any]) -> dict[str, Any]:
    return metrics.get("totals", {})


def tool_get_category_analysis(metrics: dict[str, Any], name: str | None = None) -> Any:
    rows = metrics.get("categories", [])
    if not name:
        return rows[:8]
    needle = name.lower()
    return [row for row in rows if needle in str(row.get("name", "")).lower()]


def tool_get_top_merchants(metrics: dict[str, Any]) -> list[dict[str, Any]]:
    return metrics.get("merchants", [])[:8]


def tool_get_budget_status(metrics: dict[str, Any]) -> list[dict[str, Any]]:
    return metrics.get("budgets", [])


def tool_get_spending_trends(metrics: dict[str, Any]) -> dict[str, Any]:
    return metrics.get("trends", {})


def tool_get_anomalies(metrics: dict[str, Any]) -> list[dict[str, Any]]:
    return metrics.get("anomalies", [])


def tool_get_account_summary(metrics: dict[str, Any]) -> list[dict[str, Any]]:
    return metrics.get("accounts", [])


def tool_get_goal_progress(metrics: dict[str, Any]) -> list[dict[str, Any]]:
    return metrics.get("goals", [])


def run_named_tool(name: str, metrics: dict[str, Any], argument: str | None = None) -> Any:
    mapping = {
        "get_spending_summary": lambda: tool_get_spending_summary(metrics),
        "get_category_analysis": lambda: tool_get_category_analysis(metrics, argument),
        "get_top_merchants": lambda: tool_get_top_merchants(metrics),
        "get_budget_status": lambda: tool_get_budget_status(metrics),
        "get_spending_trends": lambda: tool_get_spending_trends(metrics),
        "get_anomalies": lambda: tool_get_anomalies(metrics),
        "get_account_summary": lambda: tool_get_account_summary(metrics),
        "get_goal_progress": lambda: tool_get_goal_progress(metrics),
    }
    if name not in mapping:
        raise ValueError(f"Unknown tool: {name}")
    return mapping[name]()
