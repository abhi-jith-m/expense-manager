import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  isValid,
  parse,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subMonths,
} from 'date-fns'
import type { DateRange } from '@/types'

export const DATE_FORMATS = [
  { value: 'MMM d, yyyy', label: 'Aug 31, 2026' },
  { value: 'dd MMM yyyy', label: '31 Aug 2026' },
  { value: 'yyyy-MM-dd', label: '2026-08-31' },
  { value: 'dd/MM/yyyy', label: '31/08/2026' },
  { value: 'MM/dd/yyyy', label: '08/31/2026' },
] as const

export function parseDate(value: string): Date | null {
  if (!value) return null
  const iso = parseISO(value)
  if (isValid(iso)) return iso
  for (const pattern of ['yyyy-MM-dd', 'dd/MM/yyyy', 'MM/dd/yyyy', 'dd-MM-yyyy', 'MMM d, yyyy']) {
    const parsed = parse(value, pattern, new Date())
    if (isValid(parsed)) return parsed
  }
  const native = new Date(value)
  return isValid(native) ? native : null
}

export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function formatDate(value: string | Date, pattern = 'MMM d, yyyy'): string {
  const date = typeof value === 'string' ? parseDate(value) : value
  if (!date) return '—'
  return format(date, pattern)
}

export function formatDateTime(value: string, pattern = 'MMM d, yyyy'): string {
  const date = parseDate(value)
  if (!date) return '—'
  return format(date, `${pattern} · HH:mm`)
}

export function presetRanges(now = new Date()): DateRange[] {
  return [
    { label: 'This week', from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) },
    { label: 'This month', from: startOfMonth(now), to: endOfMonth(now) },
    { label: 'Last month', from: startOfMonth(subMonths(now, 1)), to: endOfMonth(subMonths(now, 1)) },
    { label: 'Last 3 months', from: startOfMonth(subMonths(now, 2)), to: endOfDay(now) },
    { label: 'Last 6 months', from: startOfMonth(subMonths(now, 5)), to: endOfDay(now) },
    { label: 'This year', from: startOfYear(now), to: endOfYear(now) },
  ]
}

export function defaultMonthRange(now = new Date()): DateRange {
  return { label: 'This month', from: startOfMonth(now), to: endOfMonth(now) }
}

export function previousRange(range: DateRange): DateRange {
  const days = differenceInCalendarDays(range.to, range.from) + 1
  const to = endOfDay(addDays(startOfDay(range.from), -1))
  const from = startOfDay(addDays(to, -(days - 1)))
  return { label: 'Previous period', from, to }
}

export function inRange(dateValue: string, range: DateRange): boolean {
  const date = parseDate(dateValue)
  if (!date) return false
  return date >= startOfDay(range.from) && date <= endOfDay(range.to)
}

export function nextOccurrence(
  from: Date,
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom',
  interval = 1,
): Date {
  switch (frequency) {
    case 'daily':
    case 'custom':
      return addDays(from, interval)
    case 'weekly':
      return addWeeks(from, interval)
    case 'monthly':
      return addMonths(from, interval)
    case 'yearly':
      return addYears(from, interval)
  }
}

export function daysInRange(range: DateRange): number {
  return Math.max(1, differenceInCalendarDays(range.to, range.from) + 1)
}

export function elapsedDays(range: DateRange, now = new Date()): number {
  const end = now < range.to ? now : range.to
  return Math.max(1, differenceInCalendarDays(end, range.from) + 1)
}
