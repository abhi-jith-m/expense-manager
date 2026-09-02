import 'package:intl/intl.dart';

import '../models/models.dart';

class DateFormatOption {
  const DateFormatOption({required this.value, required this.label});

  final String value;
  final String label;
}

const dateFormats = [
  DateFormatOption(value: 'MMM d, yyyy', label: 'Aug 31, 2026'),
  DateFormatOption(value: 'dd MMM yyyy', label: '31 Aug 2026'),
  DateFormatOption(value: 'yyyy-MM-dd', label: '2026-08-31'),
  DateFormatOption(value: 'dd/MM/yyyy', label: '31/08/2026'),
  DateFormatOption(value: 'MM/dd/yyyy', label: '08/31/2026'),
];

DateTime? parseDate(String value) {
  if (value.isEmpty) return null;
  final iso = DateTime.tryParse(value);
  if (iso != null) return iso;
  for (final pattern in ['yyyy-MM-dd', 'dd/MM/yyyy', 'MM/dd/yyyy', 'dd-MM-yyyy', 'MMM d, yyyy']) {
    try {
      return DateFormat(pattern).parseStrict(value);
    } catch (_) {}
  }
  return DateTime.tryParse(value);
}

String toISODate(DateTime date) => DateFormat('yyyy-MM-dd').format(date);

String formatDate(Object value, [String pattern = 'MMM d, yyyy']) {
  final date = value is DateTime ? value : parseDate('$value');
  if (date == null) return '—';
  return DateFormat(pattern).format(date);
}

String formatDateTime(String value, [String pattern = 'MMM d, yyyy']) {
  final date = parseDate(value);
  if (date == null) return '—';
  return DateFormat('$pattern · HH:mm').format(date);
}

DateTime startOfDay(DateTime date) => DateTime(date.year, date.month, date.day);

DateTime endOfDay(DateTime date) => DateTime(date.year, date.month, date.day, 23, 59, 59, 999);

DateTime startOfWeek(DateTime now) {
  final weekday = now.weekday; // Monday = 1
  return startOfDay(now.subtract(Duration(days: weekday - 1)));
}

DateTime endOfWeek(DateTime now) => endOfDay(startOfWeek(now).add(const Duration(days: 6)));

DateTime startOfMonth(DateTime now) => DateTime(now.year, now.month, 1);

DateTime endOfMonth(DateTime now) => DateTime(now.year, now.month + 1, 0, 23, 59, 59, 999);

DateTime startOfYear(DateTime now) => DateTime(now.year, 1, 1);

DateTime endOfYear(DateTime now) => DateTime(now.year, 12, 31, 23, 59, 59, 999);

int differenceInCalendarDays(DateTime a, DateTime b) {
  return startOfDay(a).difference(startOfDay(b)).inDays;
}

List<DateRange> presetRanges([DateTime? now]) {
  final current = now ?? DateTime.now();
  final lastMonth = DateTime(current.year, current.month - 1, 1);
  return [
    DateRange(label: 'This week', from: startOfWeek(current), to: endOfWeek(current)),
    DateRange(label: 'This month', from: startOfMonth(current), to: endOfMonth(current)),
    DateRange(label: 'Last month', from: startOfMonth(lastMonth), to: endOfMonth(lastMonth)),
    DateRange(
      label: 'Last 3 months',
      from: startOfMonth(DateTime(current.year, current.month - 2, 1)),
      to: endOfDay(current),
    ),
    DateRange(
      label: 'Last 6 months',
      from: startOfMonth(DateTime(current.year, current.month - 5, 1)),
      to: endOfDay(current),
    ),
    DateRange(label: 'This year', from: startOfYear(current), to: endOfYear(current)),
  ];
}

DateRange defaultMonthRange([DateTime? now]) {
  final current = now ?? DateTime.now();
  return DateRange(label: 'This month', from: startOfMonth(current), to: endOfMonth(current));
}

DateRange previousRange(DateRange range) {
  final days = differenceInCalendarDays(range.to, range.from) + 1;
  final to = endOfDay(startOfDay(range.from).subtract(const Duration(days: 1)));
  final from = startOfDay(to.subtract(Duration(days: days - 1)));
  return DateRange(label: 'Previous period', from: from, to: to);
}

bool inRange(String dateValue, DateRange range) {
  final date = parseDate(dateValue);
  if (date == null) return false;
  return !date.isBefore(startOfDay(range.from)) && !date.isAfter(endOfDay(range.to));
}

DateTime nextOccurrence(DateTime from, RecurrenceFrequency frequency, [int interval = 1]) {
  switch (frequency) {
    case RecurrenceFrequency.daily:
    case RecurrenceFrequency.custom:
      return from.add(Duration(days: interval));
    case RecurrenceFrequency.weekly:
      return from.add(Duration(days: 7 * interval));
    case RecurrenceFrequency.monthly:
      return DateTime(from.year, from.month + interval, from.day);
    case RecurrenceFrequency.yearly:
      return DateTime(from.year + interval, from.month, from.day);
  }
}

int daysInRange(DateRange range) => (differenceInCalendarDays(range.to, range.from) + 1).clamp(1, 1 << 30);

int elapsedDays(DateRange range, [DateTime? now]) {
  final current = now ?? DateTime.now();
  final end = current.isBefore(range.to) ? current : range.to;
  return (differenceInCalendarDays(end, range.from) + 1).clamp(1, 1 << 30);
}

List<DateTime> eachDayOfInterval(DateTime start, DateTime end) {
  final days = <DateTime>[];
  var cursor = startOfDay(start);
  final last = startOfDay(end);
  while (!cursor.isAfter(last)) {
    days.add(cursor);
    cursor = cursor.add(const Duration(days: 1));
  }
  return days;
}

List<DateTime> eachWeekOfInterval(DateTime start, DateTime end) {
  final weeks = <DateTime>[];
  var cursor = startOfWeek(start);
  final last = startOfDay(end);
  while (!cursor.isAfter(last)) {
    weeks.add(cursor);
    cursor = cursor.add(const Duration(days: 7));
  }
  return weeks;
}

List<DateTime> eachMonthOfInterval(DateTime start, DateTime end) {
  final months = <DateTime>[];
  var cursor = DateTime(start.year, start.month, 1);
  final last = DateTime(end.year, end.month, 1);
  while (!cursor.isAfter(last)) {
    months.add(cursor);
    cursor = DateTime(cursor.year, cursor.month + 1, 1);
  }
  return months;
}
