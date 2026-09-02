import 'package:intl/intl.dart';

import '../models/models.dart';
import 'money.dart';

List<Insight> buildInsights(
  Iterable<Transaction> current,
  Iterable<Transaction> previous,
  Iterable<Category> categories,
) {
  final insights = <Insight>[];
  final names = {for (final item in categories) item.id: item.name};

  final currentExpenses = current.where((tx) => tx.type == TransactionType.expense).toList();
  final previousExpenses = previous.where((tx) => tx.type == TransactionType.expense).toList();
  final currentIncome = sumBy(current.where((tx) => tx.type == TransactionType.income), (tx) => tx.amount);
  final currentSpend = sumBy(currentExpenses, (tx) => tx.amount);
  final previousSpend = sumBy(previousExpenses, (tx) => tx.amount);
  final spendChange = percentChange(currentSpend, previousSpend);

  if (spendChange != null && spendChange.abs() >= 5 && previousSpend > 0) {
    insights.add(
      Insight(
        id: 'spend-change',
        text: spendChange > 0
            ? 'You spent ${spendChange.toStringAsFixed(0)}% more than the previous period.'
            : 'You spent ${spendChange.abs().toStringAsFixed(0)}% less than the previous period.',
      ),
    );
  }

  final currentByCategory = categoryTotals(currentExpenses);
  final previousByCategory = categoryTotals(previousExpenses);
  ({String name, double change})? largestLift;
  for (final entry in currentByCategory.entries) {
    final prev = previousByCategory[entry.key] ?? 0;
    final change = percentChange(entry.value, prev);
    if (change == null || prev == 0 || change.abs() < 12) continue;
    if (largestLift == null || change.abs() > largestLift.change.abs()) {
      largestLift = (name: names[entry.key] ?? 'this category', change: change);
    }
  }
  if (largestLift != null) {
    insights.add(
      Insight(
        id: 'category-lift',
        text: largestLift.change > 0
            ? 'You spent ${largestLift.change.toStringAsFixed(0)}% more on ${largestLift.name} this period.'
            : 'You spent ${largestLift.change.abs().toStringAsFixed(0)}% less on ${largestLift.name} this period.',
      ),
    );
  }

  if (currentExpenses.isNotEmpty) {
    final largest = [...currentExpenses]..sort((a, b) => b.amount.compareTo(a.amount));
    final date = DateTime.tryParse(largest.first.date);
    insights.add(
      Insight(
        id: 'largest',
        text:
            'Largest transaction: ${largest.first.merchant.isEmpty ? 'Untitled' : largest.first.merchant} on ${date == null ? '—' : DateFormat('MMM d').format(date)}.',
      ),
    );
  }

  if (currentIncome > 0) {
    final rate = savingsRate(currentIncome, currentSpend);
    insights.add(Insight(id: 'savings-rate', text: 'Your savings rate this period is ${rate.toStringAsFixed(0)}%.'));
  }

  final weekdayTotals = List<double>.filled(7, 0);
  for (final tx in currentExpenses) {
    final date = DateTime.tryParse(tx.date);
    if (date != null) weekdayTotals[date.weekday % 7] += tx.amount;
  }
  final peakDay = weekdayTotals.indexOf(weekdayTotals.reduce((a, b) => a > b ? a : b));
  if (currentExpenses.length > 3 && weekdayTotals[peakDay] > 0) {
    const labels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    insights.add(Insight(id: 'weekday', text: 'You typically spend the most on ${labels[peakDay]}s.'));
  }

  return insights.take(5).toList();
}
