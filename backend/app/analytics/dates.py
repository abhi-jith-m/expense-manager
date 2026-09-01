from __future__ import annotations

import calendar
import re
from datetime import date, datetime, timedelta
from typing import Literal

from dateutil.relativedelta import relativedelta

PeriodPreset = Literal[
    "current_week",
    "previous_week",
    "current_month",
    "previous_month",
    "last_3_months",
    "last_6_months",
    "current_year",
    "previous_year",
    "custom",
]

MONTHS = {
    "january": 1,
    "february": 2,
    "march": 3,
    "april": 4,
    "may": 5,
    "june": 6,
    "july": 7,
    "august": 8,
    "september": 9,
    "october": 10,
    "november": 11,
    "december": 12,
}


def parse_iso_date(value: str) -> date:
    return date.fromisoformat(value[:10])


def days_in_range(start: date, end: date) -> int:
    return max(1, (end - start).days + 1)


def elapsed_days(start: date, end: date, today: date | None = None) -> int:
    now = today or date.today()
    stop = now if now < end else end
    return max(1, (stop - start).days + 1)


def remaining_days(end: date, today: date | None = None) -> int:
    now = today or date.today()
    return max(0, (end - now).days)


def previous_period(start: date, end: date) -> tuple[date, date]:
    last_day = calendar.monthrange(start.year, start.month)[1]
    if start.day == 1 and start.month == end.month and start.year == end.year and end.day == last_day:
        prev_end = start - timedelta(days=1)
        return prev_end.replace(day=1), prev_end
    if start == date(start.year, 1, 1) and end == date(start.year, 12, 31):
        return date(start.year - 1, 1, 1), date(start.year - 1, 12, 31)
    length = days_in_range(start, end)
    prev_end = start - timedelta(days=1)
    prev_start = prev_end - timedelta(days=length - 1)
    return prev_start, prev_end


def year_over_year(start: date, end: date) -> tuple[date, date]:
    return start - relativedelta(years=1), end - relativedelta(years=1)


def resolve_preset(preset: PeriodPreset, today: date | None = None) -> tuple[date, date]:
    now = today or date.today()
    if preset == "current_week":
        start = now - timedelta(days=now.weekday())
        return start, start + timedelta(days=6)
    if preset == "previous_week":
        start = now - timedelta(days=now.weekday() + 7)
        return start, start + timedelta(days=6)
    if preset == "current_month":
        start = now.replace(day=1)
        last = calendar.monthrange(now.year, now.month)[1]
        return start, now.replace(day=last)
    if preset == "previous_month":
        first_this = now.replace(day=1)
        prev_end = first_this - timedelta(days=1)
        return prev_end.replace(day=1), prev_end
    if preset == "last_3_months":
        start = (now.replace(day=1) - relativedelta(months=2))
        return start, now
    if preset == "last_6_months":
        start = (now.replace(day=1) - relativedelta(months=5))
        return start, now
    if preset == "current_year":
        return date(now.year, 1, 1), date(now.year, 12, 31)
    if preset == "previous_year":
        return date(now.year - 1, 1, 1), date(now.year - 1, 12, 31)
    raise ValueError(f"Unsupported preset: {preset}")


def parse_natural_range(text: str, today: date | None = None) -> tuple[date, date] | None:
    now = today or date.today()
    query = text.strip().lower()
    aliases: dict[str, PeriodPreset] = {
        "this week": "current_week",
        "current week": "current_week",
        "last week": "previous_week",
        "previous week": "previous_week",
        "this month": "current_month",
        "current month": "current_month",
        "last month": "previous_month",
        "previous month": "previous_month",
        "last 3 months": "last_3_months",
        "last three months": "last_3_months",
        "past 3 months": "last_3_months",
        "last 6 months": "last_6_months",
        "last six months": "last_6_months",
        "this year": "current_year",
        "current year": "current_year",
        "last year": "previous_year",
        "previous year": "previous_year",
        "last quarter": "last_3_months",
        "during the last quarter": "last_3_months",
    }
    if query in aliases:
        return resolve_preset(aliases[query], now)

    since = re.search(r"since\s+([a-z]+)", query)
    if since and since.group(1) in MONTHS:
        month = MONTHS[since.group(1)]
        year = now.year if month <= now.month else now.year - 1
        return date(year, month, 1), now

    in_month = re.search(r"(?:in|during)\s+([a-z]+)(?:\s+(\d{4}))?", query)
    if in_month and in_month.group(1) in MONTHS:
        month = MONTHS[in_month.group(1)]
        year = int(in_month.group(2)) if in_month.group(2) else now.year
        last = calendar.monthrange(year, month)[1]
        return date(year, month, 1), date(year, month, last)

    return None


def monthly_windows(end: date, count: int = 4) -> list[tuple[date, date]]:
    windows: list[tuple[date, date]] = []
    cursor = end.replace(day=1)
    for _ in range(count):
        last = calendar.monthrange(cursor.year, cursor.month)[1]
        windows.append((cursor, cursor.replace(day=last)))
        cursor = (cursor - timedelta(days=1)).replace(day=1)
    windows.reverse()
    return windows


def parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))
