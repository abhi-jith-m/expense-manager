import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/errors.dart';
import '../core/money.dart';
import '../core/palette.dart';
import '../models/models.dart';
import '../state/auth_controller.dart';
import '../state/finance_controller.dart';
import '../widgets/app_widgets.dart';
import '../widgets/transaction_form.dart';

class ExpensesPage extends StatelessWidget {
  const ExpensesPage({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final finance = context.watch<FinanceController>();
    return PageStack(
      children: [
        const PageHeader(title: 'Add expense'),
        AppCard(
          child: TransactionForm(
            accounts: finance.accounts,
            categories: finance.categories,
            defaultType: TransactionType.expense,
            defaultCurrency: auth.user?.currency ?? 'USD',
            autofocusAmount: true,
            onSubmit: (values) async {
              try {
                await auth.client.createTransaction(values.toInput());
                await finance.refresh();
                if (context.mounted) {
                  showSnack(context, 'Expense saved');
                  context.go('/');
                }
              } catch (error) {
                if (context.mounted) showSnack(context, toUserMessage(error), error: true);
              }
            },
          ),
        ),
      ],
    );
  }
}

class IncomePage extends StatelessWidget {
  const IncomePage({super.key});

  Future<void> _add(BuildContext context) async {
    final auth = context.read<AuthController>();
    final finance = context.read<FinanceController>();
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Add income', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 16),
                TransactionForm(
                  accounts: finance.accounts,
                  categories: finance.categories,
                  defaultType: TransactionType.income,
                  defaultCurrency: auth.user?.currency ?? 'USD',
                  onSubmit: (values) async {
                    try {
                      await auth.client.createTransaction(values.toInput(typeOverride: TransactionType.income, toAccountOverride: null));
                      await finance.refresh();
                      if (context.mounted) {
                        showSnack(context, 'Income saved');
                        Navigator.pop(context);
                      }
                    } catch (error) {
                      if (context.mounted) showSnack(context, toUserMessage(error), error: true);
                    }
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final finance = context.watch<FinanceController>();
    final income = finance.transactions.where((tx) => tx.type == TransactionType.income).toList();
    final totals = computeTotals(income);
    final bySource = <String, double>{};
    for (final tx in income) {
      final key = tx.merchant.isEmpty ? 'Unspecified' : tx.merchant;
      bySource[key] = (bySource[key] ?? 0) + tx.amount;
    }
    final sourceRows = bySource.entries.map((entry) => (name: entry.key, value: entry.value)).toList();

    return PageStack(
      children: [
        PageHeader(
          title: 'Income',
          description: 'Salary, freelance, and other inflows. Transfers are excluded from these totals.',
          actions: FilledButton.icon(onPressed: () => _add(context), icon: const Icon(Icons.add), label: const Text('Add income')),
        ),
        AppCard(
          child: Row(
            children: [
              Expanded(child: _stat(context, 'Income', CurrencyText(amount: totals.income, currency: auth.user?.currency ?? 'USD', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)))),
              Expanded(child: _stat(context, 'Sources', Text('${sourceRows.length}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)))),
              Expanded(child: _stat(context, 'Entries', Text('${income.length}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)))),
            ],
          ),
        ),
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Income by source', style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 12),
              SizedBox(
                height: 180,
                child: sourceRows.isEmpty
                    ? Center(child: Text('No income yet', style: TextStyle(color: context.aureum.label)))
                    : BarChart(
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
                                getTitlesWidget: (value, meta) {
                                  final index = value.round();
                                  if (index < 0 || index >= sourceRows.length) return const SizedBox.shrink();
                                  return Text(sourceRows[index].name, style: const TextStyle(fontSize: 10), overflow: TextOverflow.ellipsis);
                                },
                              ),
                            ),
                          ),
                          barGroups: [
                            for (var i = 0; i < sourceRows.length; i++)
                              BarChartGroupData(
                                x: i,
                                barRods: [
                                  BarChartRodData(toY: sourceRows[i].value, color: ChartColors.income, width: 16, borderRadius: BorderRadius.circular(6)),
                                ],
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
            children: [
              for (final tx in income)
                TransactionRow(
                  merchant: tx.merchant.isEmpty ? 'Income' : tx.merchant,
                  meta: tx.date,
                  amount: tx.amount,
                  currency: tx.currency,
                  tone: 'income',
                ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _stat(BuildContext context, String label, Widget value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(fontSize: 11, color: context.aureum.label)),
        value,
      ],
    );
  }
}
