import 'dart:convert';
import 'dart:typed_data';

import 'package:file_picker/file_picker.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';

import '../core/dates.dart';
import '../core/errors.dart';
import '../core/filters.dart';
import '../core/import_export.dart';
import '../core/insights.dart';
import '../core/money.dart';
import '../core/palette.dart';
import '../models/models.dart';
import '../state/auth_controller.dart';
import '../state/finance_controller.dart';
import '../widgets/app_widgets.dart';

class AnalyticsPage extends StatefulWidget {
  const AnalyticsPage({super.key});

  @override
  State<AnalyticsPage> createState() => _AnalyticsPageState();
}

class _AnalyticsPageState extends State<AnalyticsPage> {
  DateRange range = defaultMonthRange();

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final finance = context.watch<FinanceController>();
    final currency = auth.user?.currency ?? 'USD';
    final current = applyTransactionFilters(finance.transactions, const TransactionFilters(), range);
    final previous = applyTransactionFilters(finance.transactions, const TransactionFilters(), previousRange(range));
    final totals = computeTotals(current);
    final insights = buildInsights(current, previous, finance.categories);
    final expenses = current.where((tx) => tx.type == TransactionType.expense).toList();
    final span = daysInRange(range);
    final points = span > 45 ? eachWeekOfInterval(range.from, range.to) : eachDayOfInterval(range.from, range.to);
    final trend = [
      for (final day in points)
        (
          label: formatDate(day, span > 45 ? 'MMM d' : 'd'),
          totals: computeTotals(
            current.where((tx) {
              if (span <= 45) return tx.date == toISODate(day);
              final date = DateTime.tryParse(tx.date);
              if (date == null) return false;
              final end = day.add(const Duration(days: 6));
              return !date.isBefore(day) && !date.isAfter(end);
            }),
          ),
        ),
    ];
    const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    final weekday = [
      for (var i = 0; i < 7; i++)
        (
          label: weekdays[i],
          value: sumBy(expenses.where((tx) => (DateTime.tryParse(tx.date)?.weekday ?? 1) % 7 == i), (tx) => tx.amount),
        ),
    ];
    final merchants = expenses.fold<Map<String, double>>({}, (acc, tx) {
      final key = tx.merchant.isEmpty ? 'Unspecified' : tx.merchant;
      acc[key] = (acc[key] ?? 0) + tx.amount;
      return acc;
    }).entries.map((e) => (name: e.key, value: e.value)).toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    return PageStack(
      children: [
        PageHeader(
          title: 'Analytics',
          description: 'Trends, weekday patterns, and merchant concentration from live transactions.',
          actions: DateRangePickerButton(value: range, onChanged: (value) => setState(() => range = value)),
        ),
        AppCard(
          child: Row(
            children: [
              Expanded(child: _kpi(context, 'Income', totals.income, currency)),
              Expanded(child: _kpi(context, 'Expenses', totals.expenses, currency)),
              Expanded(child: _kpi(context, 'Savings', totals.savings, currency)),
            ],
          ),
        ),
        if (insights.isNotEmpty)
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Insights', style: TextStyle(fontWeight: FontWeight.w600)),
                for (final item in insights) Padding(padding: const EdgeInsets.only(top: 6), child: Text(item.text)),
              ],
            ),
          ),
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Daily spending', style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 12),
              SizedBox(
                height: 180,
                child: LineChart(
                  LineChartData(
                    gridData: const FlGridData(show: false),
                    borderData: FlBorderData(show: false),
                    titlesData: const FlTitlesData(show: false),
                    lineBarsData: [
                      LineChartBarData(
                        isCurved: true,
                        color: ChartColors.expenses,
                        dotData: const FlDotData(show: false),
                        spots: [for (var i = 0; i < trend.length; i++) FlSpot(i.toDouble(), trend[i].totals.expenses)],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Weekday spend', style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 12),
              SizedBox(
                height: 160,
                child: BarChart(
                  BarChartData(
                    gridData: const FlGridData(show: false),
                    borderData: FlBorderData(show: false),
                    titlesData: FlTitlesData(
                      topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                      rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                      leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                      bottomTitles: AxisTitles(
                        sideTitles: SideTitles(
                          showTitles: true,
                          getTitlesWidget: (value, meta) => Text(weekday[value.round().clamp(0, 6)].label, style: const TextStyle(fontSize: 11)),
                        ),
                      ),
                    ),
                    barGroups: [
                      for (var i = 0; i < weekday.length; i++)
                        BarChartGroupData(x: i, barRods: [BarChartRodData(toY: weekday[i].value, color: ChartColors.expenses, width: 12)]),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Top merchants', style: TextStyle(fontWeight: FontWeight.w600)),
              for (final item in merchants.take(8))
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(item.name),
                  trailing: CurrencyText(amount: item.value, currency: currency),
                ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _kpi(BuildContext context, String label, double amount, String currency) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(fontSize: 11, color: context.aureum.label)),
        CurrencyText(amount: amount, currency: currency, style: const TextStyle(fontWeight: FontWeight.w600)),
      ],
    );
  }
}

class ReportsPage extends StatefulWidget {
  const ReportsPage({super.key});

  @override
  State<ReportsPage> createState() => _ReportsPageState();
}

class _ReportsPageState extends State<ReportsPage> {
  DateRange range = defaultMonthRange();
  TransactionType? type;

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final finance = context.watch<FinanceController>();
    final filtered = applyTransactionFilters(finance.transactions, TransactionFilters(type: type), range);
    final totals = computeTotals(filtered);
    final byCategory = categoryTotals(filtered);
    final currency = auth.user?.currency ?? 'USD';

    Future<void> export(String kind) async {
      final name = exportFilename('report', kind);
      final bytes = kind == 'json'
          ? Uint8List.fromList(utf8.encode(const JsonEncoder.withIndent('  ').convert({
              'range': range.label,
              'totals': {'income': totals.income, 'expenses': totals.expenses, 'savings': totals.savings},
              'transactions': filtered.map((tx) => tx.toJson()).toList(),
            })))
          : Uint8List.fromList(utf8.encode(transactionsToCsv(filtered)));
      await SharePlus.instance.share(ShareParams(files: [XFile.fromData(bytes, name: name, mimeType: kind == 'json' ? 'application/json' : 'text/csv')]));
      await auth.client.createNotification({
        'type': 'export_completed',
        'title': 'Export ready',
        'body': '${kind.toUpperCase()} report downloaded.',
        'read': false,
        'metadata': <String, String>{},
      });
      await finance.refresh();
      if (context.mounted) showSnack(context, '${kind.toUpperCase()} exported');
    }

    return PageStack(
      children: [
        PageHeader(
          title: 'Reports',
          description: 'Generate summaries from live data, then export CSV or JSON.',
          actions: DateRangePickerButton(value: range, onChanged: (value) => setState(() => range = value)),
        ),
        Row(
          children: [
            DropdownButton<TransactionType?>(
              value: type,
              hint: const Text('All types'),
              items: const [
                DropdownMenuItem(value: null, child: Text('All')),
                DropdownMenuItem(value: TransactionType.expense, child: Text('Expense')),
                DropdownMenuItem(value: TransactionType.income, child: Text('Income')),
                DropdownMenuItem(value: TransactionType.transfer, child: Text('Transfer')),
              ],
              onChanged: (value) => setState(() => type = value),
            ),
            const Spacer(),
            OutlinedButton(onPressed: () => export('csv'), child: const Text('CSV')),
            const SizedBox(width: 8),
            OutlinedButton(onPressed: () => export('json'), child: const Text('JSON')),
          ],
        ),
        AppCard(
          child: Row(
            children: [
              Expanded(child: CurrencyText(amount: totals.income, currency: currency, style: const TextStyle(fontWeight: FontWeight.w600))),
              Expanded(child: CurrencyText(amount: totals.expenses, currency: currency, style: const TextStyle(fontWeight: FontWeight.w600))),
              Expanded(child: CurrencyText(amount: totals.savings, currency: currency, style: const TextStyle(fontWeight: FontWeight.w600))),
            ],
          ),
        ),
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('By category', style: TextStyle(fontWeight: FontWeight.w600)),
              for (final entry in byCategory.entries)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(finance.categoryMap[entry.key]?.name ?? 'Other'),
                  trailing: CurrencyText(amount: entry.value, currency: currency),
                ),
            ],
          ),
        ),
      ],
    );
  }
}

class ImportExportPage extends StatefulWidget {
  const ImportExportPage({super.key});

  @override
  State<ImportExportPage> createState() => _ImportExportPageState();
}

class _ImportExportPageState extends State<ImportExportPage> {
  List<MappedImportRow> preview = [];

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final finance = context.watch<FinanceController>();
    return PageStack(
      children: [
        const PageHeader(
          title: 'Import / Export',
          description: 'Map CSV or JSON columns, preview errors, then commit valid rows only.',
        ),
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              FilledButton(
                onPressed: () async {
                  final file = await FilePicker.pickFile(allowedExtensions: ['csv', 'json'], type: FileType.custom);
                  if (file == null) return;
                  try {
                    final text = utf8.decode(await file.readAsBytes());
                    late final List<Map<String, String>> rows;
                    late final List<String> headers;
                    if (file.name.toLowerCase().endsWith('.json')) {
                      final parsed = jsonDecode(text);
                      final list = parsed is List ? parsed : (parsed as Map)['transactions'] as List? ?? [];
                      if (list.isEmpty) throw Exception('JSON must contain an array of transactions.');
                      headers = {for (final row in list) ...(row as Map).keys.map((key) => '$key')}.toList();
                      rows = [
                        for (final row in list)
                          {for (final header in headers) header: '${(row as Map)[header] ?? ''}'}
                      ];
                    } else {
                      final table = parseCsvTable(text);
                      headers = table.headers;
                      rows = table.rows;
                    }
                    final mapping = detectColumns(headers);
                    if (finance.accounts.isEmpty) throw const AppError('Create an account before importing.');
                    setState(() {
                      preview = mapImportRows(
                        rows,
                        mapping,
                        defaultAccountId: finance.accounts.first.id,
                        defaultCurrency: auth.user?.currency ?? 'USD',
                        categories: finance.categories,
                        accountNames: {for (final item in finance.accounts) item.id: item.name},
                      );
                    });
                  } catch (error) {
                    if (context.mounted) showSnack(context, toUserMessage(error), error: true);
                  }
                },
                child: const Text('Choose CSV or JSON'),
              ),
              const SizedBox(height: 8),
              OutlinedButton(
                onPressed: () async {
                  final csv = transactionsToCsv(finance.transactions);
                  await SharePlus.instance.share(
                    ShareParams(files: [XFile.fromData(Uint8List.fromList(utf8.encode(csv)), name: exportFilename('transactions', 'csv'), mimeType: 'text/csv')]),
                  );
                },
                child: const Text('Export transactions CSV'),
              ),
            ],
          ),
        ),
        if (preview.isNotEmpty)
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('${preview.length} rows · ${preview.where((row) => row.errors.isEmpty).length} valid'),
                const SizedBox(height: 8),
                for (final row in preview.take(8))
                  Text(
                    row.errors.isEmpty
                        ? 'Row ${row.row}: ${row.transaction.merchant} ${row.transaction.amount}'
                        : 'Row ${row.row}: ${row.errors.map((e) => e.message).join(', ')}',
                    style: TextStyle(color: row.errors.isEmpty ? null : Theme.of(context).colorScheme.error),
                  ),
                const SizedBox(height: 12),
                FilledButton(
                  onPressed: () async {
                    final valid = preview.where((row) => row.errors.isEmpty);
                    for (final row in valid) {
                      await auth.client.createTransaction(row.transaction);
                    }
                    await auth.client.createNotification({
                      'type': 'import_completed',
                      'title': 'Import completed',
                      'body': '${valid.length} transactions imported.',
                      'read': false,
                      'metadata': <String, String>{},
                    });
                    await finance.refresh();
                    if (context.mounted) showSnack(context, '${valid.length} transactions imported');
                    setState(() => preview = []);
                  },
                  child: const Text('Import valid rows'),
                ),
              ],
            ),
          ),
      ],
    );
  }
}
