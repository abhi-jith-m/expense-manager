from __future__ import annotations

import re

from app.analytics.engine import flatten_metrics
from app.schemas.insights import FinancialInsight

NUMBER_RE = re.compile(r"(?<![\w.])(-?\d{1,3}(?:,\d{3})*(?:\.\d+)?|-?\d+(?:\.\d+)?)(?![\w])")


def collect_known_numbers(metrics: dict, insights: list[FinancialInsight] | None = None) -> set[float]:
    known = {round(value, 2) for value in flatten_metrics(metrics).values()}
    known.update({round(int(value), 2) for value in flatten_metrics(metrics).values()})
    if insights:
        for insight in insights:
            for value in insight.metrics.values():
                if isinstance(value, (int, float)):
                    known.add(round(float(value), 2))
                    known.add(round(float(value), 1))
                    known.add(round(float(value), 0))
    for extra in (0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 24, 30, 31, 100):
        known.add(float(extra))
    return known


def extract_numbers(text: str) -> list[float]:
    found: list[float] = []
    for match in NUMBER_RE.findall(text or ""):
        raw = match.replace(",", "")
        try:
            found.append(float(raw))
        except ValueError:
            continue
    return found


def insight_is_grounded(insight: FinancialInsight, known: set[float]) -> bool:
    blobs = [insight.title, insight.summary, insight.explanation, insight.recommendation or ""]
    for number in extract_numbers(" ".join(blobs)):
        if _close_to_known(number, known):
            continue
        if 1900 <= number <= 2100:
            continue
        return False
    return True


def _close_to_known(number: float, known: set[float]) -> bool:
    for value in known:
        if abs(number - value) <= 0.06:
            return True
        if value and abs(number - value) / abs(value) <= 0.002:
            return True
    return False


def filter_grounded(insights: list[FinancialInsight], metrics: dict) -> tuple[list[FinancialInsight], int]:
    known = collect_known_numbers(metrics, insights)
    kept: list[FinancialInsight] = []
    rejected = 0
    for insight in insights:
        if insight.source == "deterministic" or insight_is_grounded(insight, known):
            kept.append(insight)
        else:
            rejected += 1
    return kept, rejected
