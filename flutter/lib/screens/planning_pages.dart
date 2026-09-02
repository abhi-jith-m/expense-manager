import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/dates.dart';
import '../core/errors.dart';
import '../core/money.dart';
import '../models/models.dart';
import '../state/auth_controller.dart';
import '../state/finance_controller.dart';
import '../widgets/app_widgets.dart';

class GoalsPage extends StatelessWidget {
  const GoalsPage({super.key});

  Future<void> _create(BuildContext context) async {
    final auth = context.read<AuthController>();
    final finance = context.read<FinanceController>();
    final name = TextEditingController();
    final target = TextEditingController();
    final current = TextEditingController(text: '0');
    DateTime? deadline;
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom, left: 20, right: 20, top: 20),
          child: StatefulBuilder(
            builder: (context, setModal) {
              return Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('New goal', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 12),
                  TextField(controller: name, decoration: const InputDecoration(labelText: 'Name')),
                  const SizedBox(height: 12),
                  TextField(controller: target, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: 'Target')),
                  const SizedBox(height: 12),
                  TextField(controller: current, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: 'Current')),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Deadline'),
                    subtitle: Text(deadline == null ? 'Optional' : toISODate(deadline!)),
                    onTap: () async {
                      final next = await showDatePicker(context: context, initialDate: DateTime.now(), firstDate: DateTime.now(), lastDate: DateTime(2100));
                      if (next != null) setModal(() => deadline = next);
                    },
                  ),
                  FilledButton(
                    onPressed: () async {
                      try {
                        await auth.client.createGoal({
                          'name': name.text.trim(),
                          'targetAmount': double.tryParse(target.text) ?? 0,
                          'currentAmount': double.tryParse(current.text) ?? 0,
                          'deadline': deadline == null ? null : toISODate(deadline!),
                          'icon': 'Target',
                          'color': '#A855F7',
                        });
                        await finance.refresh();
                        if (context.mounted) {
                          showSnack(context, 'Goal created');
                          Navigator.pop(context);
                        }
                      } catch (error) {
                        if (context.mounted) showSnack(context, toUserMessage(error), error: true);
                      }
                    },
                    child: const Text('Save'),
                  ),
                  const SizedBox(height: 20),
                ],
              );
            },
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final finance = context.watch<FinanceController>();
    return PageStack(
      children: [
        PageHeader(
          title: 'Goals',
          description: 'Track emergency funds and planned purchases against a target date.',
          actions: FilledButton(onPressed: () => _create(context), child: const Text('Add goal')),
        ),
        if (finance.goals.isEmpty)
          EmptyState(
            icon: Icons.flag_outlined,
            title: 'No goals yet',
            description: 'Create a target, then update progress as you save.',
            action: FilledButton(onPressed: () => _create(context), child: const Text('Create goal')),
          )
        else
          for (final goal in finance.goals)
            Builder(
              builder: (context) {
                final left = remaining(goal.targetAmount, goal.currentAmount);
                final percent = usagePercent(goal.currentAmount, goal.targetAmount);
                final monthly = goal.deadline == null ? null : requiredMonthlySavings(left, DateTime.parse(goal.deadline!));
                return AppCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          CategoryGlyph(name: goal.icon, color: goal.color),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(goal.name, style: const TextStyle(fontWeight: FontWeight.w500)),
                                Text(goal.deadline == null ? 'No deadline' : 'Due ${goal.deadline}', style: TextStyle(fontSize: 12, color: context.aureum.label)),
                              ],
                            ),
                          ),
                          CurrencyText(amount: goal.currentAmount, currency: auth.user?.currency ?? 'USD'),
                        ],
                      ),
                      const SizedBox(height: 8),
                      UsageBar(value: percent),
                      const SizedBox(height: 8),
                      Text(
                        '${percent.toStringAsFixed(0)}% · remaining ${formatMoneyLabel(left, auth.user?.currency ?? 'USD')}${monthly == null ? '' : ' · ${formatMoneyLabel(monthly, auth.user?.currency ?? 'USD')} / month'}',
                        style: TextStyle(fontSize: 12, color: context.aureum.label),
                      ),
                      Row(
                        children: [
                          Expanded(
                            child: TextFormField(
                              initialValue: goal.currentAmount.toString(),
                              keyboardType: const TextInputType.numberWithOptions(decimal: true),
                              decoration: const InputDecoration(labelText: 'Update progress'),
                              onFieldSubmitted: (value) async {
                                final parsed = double.tryParse(value);
                                if (parsed == null) return;
                                await auth.client.updateGoal(goal.id, {'currentAmount': parsed});
                                await finance.refresh();
                              },
                            ),
                          ),
                          TextButton(
                            onPressed: () async {
                              await auth.client.deleteGoal(goal.id);
                              await finance.refresh();
                              if (context.mounted) showSnack(context, 'Goal removed');
                            },
                            child: const Text('Delete'),
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
      ],
    );
  }
}

String formatMoneyLabel(double amount, String currency) {
  return '${amount.toStringAsFixed(2)} $currency';
}

class RecurringPage extends StatelessWidget {
  const RecurringPage({super.key});

  Future<void> _create(BuildContext context) async {
    final auth = context.read<AuthController>();
    final finance = context.read<FinanceController>();
    var type = TransactionType.expense;
    final amount = TextEditingController();
    final merchant = TextEditingController();
    String? accountId = finance.accounts.isEmpty ? null : finance.accounts.first.id;
    String? categoryId;
    var frequency = RecurrenceFrequency.monthly;
    final interval = TextEditingController(text: '1');
    var start = DateTime.now();
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom, left: 20, right: 20, top: 20),
          child: StatefulBuilder(
            builder: (context, setModal) {
              return SingleChildScrollView(
                child: Column(
                  children: [
                    Text('New recurring transaction', style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<TransactionType>(
                      initialValue: type,
                      items: const [
                        DropdownMenuItem(value: TransactionType.expense, child: Text('Expense')),
                        DropdownMenuItem(value: TransactionType.income, child: Text('Income')),
                      ],
                      onChanged: (value) => setModal(() => type = value ?? type),
                    ),
                    const SizedBox(height: 12),
                    TextField(controller: amount, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: 'Amount')),
                    const SizedBox(height: 12),
                    TextField(controller: merchant, decoration: const InputDecoration(labelText: 'Merchant or source')),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      initialValue: accountId,
                      decoration: const InputDecoration(labelText: 'Account'),
                      items: [for (final item in finance.accounts) DropdownMenuItem(value: item.id, child: Text(item.name))],
                      onChanged: (value) => setModal(() => accountId = value),
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      initialValue: categoryId,
                      decoration: const InputDecoration(labelText: 'Category'),
                      items: [for (final item in finance.categories.where((c) => c.parentId == null)) DropdownMenuItem(value: item.id, child: Text(item.name))],
                      onChanged: (value) => setModal(() => categoryId = value),
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<RecurrenceFrequency>(
                      initialValue: frequency,
                      items: [
                        for (final item in RecurrenceFrequency.values)
                          DropdownMenuItem(value: item, child: Text(item.value)),
                      ],
                      onChanged: (value) => setModal(() => frequency = value ?? frequency),
                    ),
                    const SizedBox(height: 12),
                    TextField(controller: interval, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Interval')),
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Start'),
                      subtitle: Text(toISODate(start)),
                      onTap: () async {
                        final next = await showDatePicker(context: context, initialDate: start, firstDate: DateTime(2000), lastDate: DateTime(2100));
                        if (next != null) setModal(() => start = next);
                      },
                    ),
                    FilledButton(
                      onPressed: () async {
                        if (accountId == null) return;
                        try {
                          await auth.client.createRecurring({
                            'type': type.value,
                            'amount': double.tryParse(amount.text) ?? 0,
                            'currency': auth.user?.currency ?? 'USD',
                            'categoryId': categoryId,
                            'accountId': accountId,
                            'merchant': merchant.text,
                            'notes': '',
                            'paymentMethod': 'card',
                            'frequency': frequency.value,
                            'interval': int.tryParse(interval.text) ?? 1,
                            'startDate': toISODate(start),
                            'endDate': null,
                            'nextOccurrence': toISODate(start),
                            'active': true,
                          });
                          await finance.refresh();
                          if (context.mounted) {
                            showSnack(context, 'Recurring rule created');
                            Navigator.pop(context);
                          }
                        } catch (error) {
                          if (context.mounted) showSnack(context, toUserMessage(error), error: true);
                        }
                      },
                      child: const Text('Save'),
                    ),
                    const SizedBox(height: 20),
                  ],
                ),
              );
            },
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final finance = context.watch<FinanceController>();
    return PageStack(
      children: [
        PageHeader(
          title: 'Recurring',
          description: 'Due items generate real transactions once per occurrence. Existing dates are never duplicated.',
          actions: FilledButton(onPressed: () => _create(context), child: const Text('Add recurring')),
        ),
        if (finance.recurring.isEmpty)
          EmptyState(
            icon: Icons.repeat,
            title: 'No recurring rules',
            description: 'Use this for rent, subscriptions, salary, and utilities.',
            action: FilledButton(onPressed: () => _create(context), child: const Text('Create rule')),
          )
        else
          for (final rule in finance.recurring)
            AppCard(
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(rule.merchant.isEmpty ? rule.type.value : rule.merchant, style: const TextStyle(fontWeight: FontWeight.w500)),
                        Text('${rule.frequency.value} · next ${rule.nextOccurrence} · ${rule.active ? 'active' : 'paused'}', style: TextStyle(fontSize: 12, color: context.aureum.label)),
                      ],
                    ),
                  ),
                  CurrencyText(amount: rule.amount, currency: rule.currency, tone: rule.type.value),
                  Switch(
                    value: rule.active,
                    onChanged: (checked) async {
                      await auth.client.updateRecurring(rule.id, {'active': checked});
                      await finance.refresh();
                    },
                  ),
                  TextButton(
                    onPressed: () async {
                      await auth.client.deleteRecurring(rule.id);
                      await finance.refresh();
                      if (context.mounted) showSnack(context, 'Removed');
                    },
                    child: const Text('Delete'),
                  ),
                ],
              ),
            ),
      ],
    );
  }
}

class NotificationsPage extends StatelessWidget {
  const NotificationsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final finance = context.watch<FinanceController>();
    return PageStack(
      children: [
        PageHeader(
          title: 'Notifications',
          description: 'Budget, recurring, goal, and import events. Preferences live in Settings.',
          actions: finance.notifications.isEmpty
              ? null
              : OutlinedButton(
                  onPressed: () async {
                    await auth.client.markAllNotificationsRead();
                    await finance.refresh();
                    if (context.mounted) showSnack(context, 'All marked read');
                  },
                  child: const Text('Mark all read'),
                ),
        ),
        if (finance.notifications.isEmpty)
          const EmptyState(
            icon: Icons.notifications_none,
            title: "You're all caught up",
            description: 'Meaningful alerts will appear here when budgets, goals, or imports need attention.',
          )
        else
          AppCard(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                for (final item in finance.notifications)
                  Opacity(
                    opacity: item.read ? 0.7 : 1,
                    child: ListTile(
                      title: Text(item.title),
                      subtitle: Text('${item.body}\n${formatDateTime(item.createdAt)}'),
                      isThreeLine: true,
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (!item.read)
                            TextButton(
                              onPressed: () async {
                                await auth.client.markNotificationRead(item.id);
                                await finance.refresh();
                              },
                              child: const Text('Mark read'),
                            ),
                          TextButton(
                            onPressed: () async {
                              await auth.client.deleteNotification(item.id);
                              await finance.refresh();
                            },
                            child: const Text('Dismiss'),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ),
      ],
    );
  }
}
