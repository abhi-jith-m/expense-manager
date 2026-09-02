import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../core/dates.dart';
import '../core/filters.dart';
import '../core/insights.dart';
import '../core/money.dart';
import '../core/palette.dart';
import '../models/models.dart';
import '../state/auth_controller.dart';
import '../state/finance_controller.dart';
import '../state/insights_controller.dart';
import '../widgets/app_widgets.dart';

class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  DateRange range = defaultMonthRange();
  var requested = false;

  Future<void> _loadInsights([DateRange? next]) async {
    if (!mounted) return;
    await context.read<InsightsController>().analyze(
          context.read<AuthController>(),
          context.read<FinanceController>(),
          next ?? range,
        );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final finance = context.watch<FinanceController>();
    if (finance.loading && finance.transactions.isEmpty) return const LoadingState();
    if (finance.error != null) {
      return ErrorState(
        title: "Couldn't load your finances",
        description: 'Check your connection and try again.',
        onRetry: finance.refresh,
      );
    }

    final currency = auth.user?.currency ?? 'USD';
    final current = applyTransactionFilters(finance.transactions, const TransactionFilters(), range);
    final previous = applyTransactionFilters(finance.transactions, const TransactionFilters(), previousRange(range));
    final totals = computeTotals(current);
    final previousTotals = computeTotals(previous);
    final balance = finance.accounts.fold<double>(0, (sum, account) => sum + accountBalance(account, finance.transactions));
    final remote = context.watch<InsightsController>();
    if (!requested && !finance.loading) {
      requested = true;
      WidgetsBinding.instance.addPostFrameCallback((_) => _loadInsights());
    }
    final topRemote = remote.analysis?.insights.isNotEmpty == true ? remote.analysis!.insights.first : null;
    final localInsights = buildInsights(current, previous, finance.categories);
    final categoryMap = finance.categoryMap;
    final balanceChange = percentChange(totals.savings, previousTotals.savings);
    final trendData = _trend(current, range);
    final categoryData = _categories(current, categoryMap);
    final recent = current.take(6).toList();

    return RefreshIndicator(
      onRefresh: () async {
        await finance.refresh();
        await _loadInsights();
      },
      child: ListView(
        padding: context.density.pagePadding,
        children: [
          Row(
            children: [
              Expanded(child: DateRangePickerButton(value: range, onChanged: (value) {
                setState(() => range = value);
                _loadInsights(value);
              })),
            ],
          ),
          SizedBox(height: context.density.sectionGap),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Total balance', style: Theme.of(context).textTheme.bodySmall),
                const SizedBox(height: 4),
                FinancialAmount(
                  amount: balance,
                  currency: currency,
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                if (balanceChange != null)
                  Text(
                    '${balanceChange > 0 ? '+' : ''}${balanceChange.toStringAsFixed(1)}% this period',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: balanceChange >= 0 ? context.aureum.income : context.aureum.expense,
                        ),
                  ),
                SizedBox(height: context.density.gap),
                Row(
                  children: [
                    Expanded(child: MetricTile(label: 'Income', amount: totals.income, currency: currency, tone: 'income', change: percentChange(totals.income, previousTotals.income))),
                    Expanded(child: MetricTile(label: 'Expenses', amount: totals.expenses, currency: currency, tone: 'expense', change: percentChange(totals.expenses, previousTotals.expenses), invertChange: true)),
                  ],
                ),
                SizedBox(height: context.density.gap),
                MetricTile(label: 'Savings', amount: totals.savings, currency: currency, tone: 'savings', change: percentChange(totals.savings, previousTotals.savings)),
              ],
            ),
          ),
          if (topRemote != null || localInsights.isNotEmpty) ...[
            SizedBox(height: context.density.sectionGap),
            InkWell(
              onTap: () => context.push('/insights'),
              child: AppCard(
                child: Row(
                  children: [
                    Icon(Icons.auto_awesome, color: Theme.of(context).colorScheme.primary),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        topRemote?.title ?? localInsights.first.text,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
          if (finance.transactions.isEmpty) ...[
            SizedBox(height: context.density.sectionGap),
            EmptyState(
              icon: Icons.receipt_long_outlined,
              title: 'No transactions yet',
              description: 'Start tracking your spending to see your financial insights here.',
              action: FilledButton(onPressed: () => context.push('/expenses'), child: const Text('Add expense')),
            ),
          ],
          SizedBox(height: context.density.sectionGap),
          const SectionHeader(title: 'Spending'),
          AppCard(
            child: SizedBox(
              height: 200,
              child: trendData.every((item) => item.expenses == 0)
                  ? Center(child: Text('No expenses in range', style: Theme.of(context).textTheme.bodySmall))
                  : LineChart(
                      LineChartData(
                        lineTouchData: LineTouchData(
                          touchTooltipData: LineTouchTooltipData(
                            getTooltipItems: (spots) => [
                              for (final spot in spots)
                                LineTooltipItem(
                                  '${trendData[spot.x.round()].label}\n${spot.y.toStringAsFixed(0)}',
                                  Theme.of(context).textTheme.bodySmall!.copyWith(color: Theme.of(context).colorScheme.onInverseSurface),
                                ),
                            ],
                          ),
                        ),
                        gridData: const FlGridData(show: false),
                        borderData: FlBorderData(show: false),
                        titlesData: FlTitlesData(
                          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                          leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                          bottomTitles: AxisTitles(
                            sideTitles: SideTitles(
                              showTitles: true,
                              interval: (trendData.length / 4).clamp(1, 30).toDouble(),
                              getTitlesWidget: (value, meta) {
                                final index = value.round();
                                if (index < 0 || index >= trendData.length) return const SizedBox.shrink();
                                return Text(trendData[index].label, style: Theme.of(context).textTheme.bodySmall);
                              },
                            ),
                          ),
                        ),
                        lineBarsData: [
                          LineChartBarData(
                            isCurved: true,
                            color: ChartColors.expenses,
                            barWidth: 2,
                            dotData: const FlDotData(show: false),
                            belowBarData: BarAreaData(show: true, color: ChartColors.expenses.withValues(alpha: 0.14)),
                            spots: [for (var i = 0; i < trendData.length; i++) FlSpot(i.toDouble(), trendData[i].expenses)],
                          ),
                        ],
                      ),
                    ),
            ),
          ),
          if (finance.budgets.isNotEmpty) ...[
            SizedBox(height: context.density.sectionGap),
            SectionHeader(title: 'Budget', actionLabel: 'All', onAction: () => context.go('/budgets')),
            AppCard(
              child: Column(
                children: [
                  for (final budget in finance.budgets.take(3))
                    BudgetProgressTile(
                      name: budget.name,
                      spent: current
                          .where((tx) => tx.type == TransactionType.expense && (budget.categoryId == null || tx.categoryId == budget.categoryId))
                          .fold<double>(0, (sum, tx) => sum + tx.amount),
                      limit: budget.limitAmount,
                      currency: currency,
                      alertThreshold: budget.alertThreshold,
                      onTap: () => context.go('/budgets'),
                    ),
                ],
              ),
            ),
          ],
          if (categoryData.isNotEmpty) ...[
            SizedBox(height: context.density.sectionGap),
            const SectionHeader(title: 'Top categories'),
            AppCard(
              child: Column(
                children: [
                  for (final item in categoryData.take(4))
                    Padding(
                      padding: context.density.rowPadding,
                      child: Row(
                        children: [
                          CategoryGlyph(name: categoryMap[item.id]?.icon ?? 'CircleEllipsis', color: item.color, size: 32),
                          const SizedBox(width: 10),
                          Expanded(child: Text(item.name, overflow: TextOverflow.ellipsis)),
                          FinancialAmount(amount: item.value, currency: currency, style: Theme.of(context).textTheme.titleSmall),
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ],
          SizedBox(height: context.density.sectionGap),
          SectionHeader(title: 'Recent transactions', actionLabel: 'View all', onAction: () => context.go('/transactions')),
          if (recent.isEmpty)
            Text('No transactions in this period.', style: Theme.of(context).textTheme.bodySmall)
          else
            AppCard(
              child: Column(
                children: [
                  for (final tx in recent)
                    TransactionRow(
                      merchant: tx.merchant.isEmpty ? (tx.description.isEmpty ? 'Untitled' : tx.description) : tx.merchant,
                      meta: '${categoryMap[tx.categoryId ?? '']?.name ?? tx.type.value} · ${formatDate(tx.date)}',
                      amount: tx.amount,
                      currency: tx.currency,
                      icon: categoryMap[tx.categoryId ?? '']?.icon,
                      color: categoryMap[tx.categoryId ?? '']?.color,
                      tone: tx.type.value,
                      onTap: () => context.push('/transactions?edit=${tx.id}'),
                    ),
                ],
              ),
            ),
          const SizedBox(height: 72),
        ],
      ),
    );
  }

  List<({String label, double expenses})> _trend(List<Transaction> current, DateRange range) {
    final days = daysInRange(range);
    final points = days <= 31
        ? eachDayOfInterval(range.from, range.to)
        : days <= 180
            ? eachWeekOfInterval(range.from, range.to)
            : eachMonthOfInterval(range.from, range.to);
    final sampled = points.length > 90 ? [for (var i = 0; i < points.length; i += (points.length / 60).ceil()) points[i]] : points;
    return [
      for (final point in sampled)
        () {
          final scoped = days <= 31
              ? current.where((tx) => tx.date == toISODate(point))
              : current.where((tx) {
                  final date = DateTime.tryParse(tx.date);
                  if (date == null) return false;
                  if (days <= 180) {
                    final end = point.add(const Duration(days: 6));
                    return !date.isBefore(point) && !date.isAfter(end);
                  }
                  return date.month == point.month && date.year == point.year;
                });
          final label = days <= 31
              ? DateFormat('d').format(point)
              : days <= 180
                  ? DateFormat('MMM d').format(point)
                  : DateFormat('MMM').format(point);
          return (label: label, expenses: computeTotals(scoped).expenses);
        }(),
    ];
  }

  List<({String id, String name, double value, String? color})> _categories(List<Transaction> current, Map<String, Category> categoryMap) {
    final totalsByCategory = <String, double>{};
    for (final tx in current.where((tx) => tx.type == TransactionType.expense && tx.categoryId != null)) {
      totalsByCategory[tx.categoryId!] = (totalsByCategory[tx.categoryId!] ?? 0) + tx.amount;
    }
    return totalsByCategory.entries
        .map((entry) => (id: entry.key, name: categoryMap[entry.key]?.name ?? 'Other', value: entry.value, color: categoryMap[entry.key]?.color))
        .toList()
      ..sort((a, b) => b.value.compareTo(a.value));
  }
}
