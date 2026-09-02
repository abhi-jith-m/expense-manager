import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/dates.dart';
import '../core/defaults.dart';
import '../core/errors.dart';
import '../core/money.dart';
import '../core/palette.dart';
import '../models/models.dart';
import '../state/auth_controller.dart';
import '../state/finance_controller.dart';
import '../widgets/app_widgets.dart';

class BudgetsPage extends StatelessWidget {
  const BudgetsPage({super.key});

  Future<void> _create(BuildContext context) async {
    final auth = context.read<AuthController>();
    final finance = context.read<FinanceController>();
    final name = TextEditingController();
    final limit = TextEditingController();
    final threshold = TextEditingController(text: '80');
    String? categoryId;
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
                  Text('New budget', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 12),
                  TextField(controller: name, decoration: const InputDecoration(labelText: 'Name')),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: categoryId,
                    decoration: const InputDecoration(labelText: 'Category'),
                    items: [
                      const DropdownMenuItem(value: null, child: Text('Overall')),
                      for (final item in finance.categories.where((item) => item.kind == CategoryKind.expense && item.parentId == null))
                        DropdownMenuItem(value: item.id, child: Text(item.name)),
                    ],
                    onChanged: (value) => setModal(() => categoryId = value),
                  ),
                  const SizedBox(height: 12),
                  TextField(controller: limit, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: 'Limit')),
                  const SizedBox(height: 12),
                  TextField(controller: threshold, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Alert threshold %')),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: () async {
                      try {
                        final amount = double.tryParse(limit.text) ?? 0;
                        if (name.text.trim().length < 2 || amount <= 0) return;
                        await auth.client.createBudget({
                          'name': name.text.trim(),
                          'categoryId': categoryId,
                          'limitAmount': amount,
                          'period': 'monthly',
                          'startDate': toISODate(DateTime.now()),
                          'endDate': null,
                          'alertThreshold': double.tryParse(threshold.text) ?? 80,
                        });
                        await finance.refresh();
                        if (context.mounted) {
                          showSnack(context, 'Budget created');
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
    final range = defaultMonthRange();
    return PageStack(
      children: [
        PageHeader(
          title: 'Budgets',
          description: 'Progress uses real spending in the current period. Alerts only fire from actual usage.',
          actions: FilledButton(onPressed: () => _create(context), child: const Text('Add budget')),
        ),
        if (finance.budgets.isEmpty)
          EmptyState(
            icon: Icons.account_balance_wallet_outlined,
            title: 'No budgets',
            description: 'Set a monthly limit for a category or your overall spending.',
            action: FilledButton(onPressed: () => _create(context), child: const Text('Create budget')),
          )
        else
          for (final budget in finance.budgets)
            Builder(
              builder: (context) {
                final spent = finance.transactions
                    .where((tx) => tx.type == TransactionType.expense && inRange(tx.date, range) && (budget.categoryId == null || tx.categoryId == budget.categoryId))
                    .fold<double>(0, (sum, tx) => sum + tx.amount);
                final percent = usagePercent(spent, budget.limitAmount);
                final left = remaining(budget.limitAmount, spent);
                final projected = projectedSpend(spent, elapsedDays(range), daysInRange(range));
                final over = percent >= 100;
                final near = !over && percent >= budget.alertThreshold;
                return AppCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(budget.name, style: const TextStyle(fontWeight: FontWeight.w500)),
                                Text('${budget.period.value} · alert at ${budget.alertThreshold.toStringAsFixed(0)}%', style: TextStyle(fontSize: 12, color: context.aureum.label)),
                              ],
                            ),
                          ),
                          CurrencyText(amount: left, currency: auth.user?.currency ?? 'USD', tone: over ? 'expense' : null),
                        ],
                      ),
                      const SizedBox(height: 8),
                      UsageBar(value: percent, tone: over ? 'danger' : near ? 'warning' : 'default'),
                      const SizedBox(height: 8),
                      Text(
                        '${percent.toStringAsFixed(0)}% used · projected ${projected.toStringAsFixed(0)} this period${over ? ' · Over limit' : near ? ' · Approaching limit' : ''}',
                        style: TextStyle(fontSize: 12, color: context.aureum.label),
                      ),
                      TextButton(
                        onPressed: () async {
                          await auth.client.deleteBudget(budget.id);
                          await finance.refresh();
                          if (context.mounted) showSnack(context, 'Budget removed');
                        },
                        child: const Text('Delete'),
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

class CategoriesPage extends StatelessWidget {
  const CategoriesPage({super.key});

  Future<void> _edit(BuildContext context, [Category? item]) async {
    final auth = context.read<AuthController>();
    final finance = context.read<FinanceController>();
    final name = TextEditingController(text: item?.name ?? '');
    var kind = item?.kind ?? CategoryKind.expense;
    var icon = item?.icon ?? 'CircleEllipsis';
    var color = item?.color ?? categoryColors.first;
    var parentId = item?.parentId;
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
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(item == null ? 'New category' : 'Edit category', style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: 12),
                    TextField(controller: name, decoration: const InputDecoration(labelText: 'Name')),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<CategoryKind>(
                      initialValue: kind,
                      decoration: const InputDecoration(labelText: 'Type'),
                      items: const [
                        DropdownMenuItem(value: CategoryKind.expense, child: Text('Expense')),
                        DropdownMenuItem(value: CategoryKind.income, child: Text('Income')),
                      ],
                      onChanged: (value) => setModal(() => kind = value ?? kind),
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      initialValue: parentId,
                      decoration: const InputDecoration(labelText: 'Parent'),
                      items: [
                        const DropdownMenuItem(value: null, child: Text('None')),
                        for (final parent in finance.categories.where((c) => c.parentId == null && c.id != item?.id))
                          DropdownMenuItem(value: parent.id, child: Text(parent.name)),
                      ],
                      onChanged: (value) => setModal(() => parentId = value),
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      children: [
                        for (final option in categoryIcons)
                          GestureDetector(
                            onTap: () => setModal(() => icon = option),
                            child: Container(
                              padding: const EdgeInsets.all(2),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: icon == option ? Border.all(color: Theme.of(context).colorScheme.primary, width: 2) : null,
                              ),
                              child: CategoryGlyph(name: option, color: color, size: 28),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      children: [
                        for (final option in categoryColors)
                          GestureDetector(
                            onTap: () => setModal(() => color = option),
                            child: CircleAvatar(radius: 12, backgroundColor: parseHex(option)),
                          ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: () async {
                        try {
                          if (item == null) {
                            await auth.client.createCategory({
                              'name': name.text.trim(),
                              'kind': kind.value,
                              'icon': icon,
                              'color': color,
                              'parentId': parentId,
                              'sortOrder': finance.categories.length,
                              'isSystem': false,
                            });
                            if (context.mounted) showSnack(context, 'Category created');
                          } else {
                            await auth.client.updateCategory(item.id, {
                              'name': name.text.trim(),
                              'kind': kind.value,
                              'icon': icon,
                              'color': color,
                              'parentId': parentId,
                            });
                            if (context.mounted) showSnack(context, 'Category updated');
                          }
                          await finance.refresh();
                          if (context.mounted) Navigator.pop(context);
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
    final finance = context.watch<FinanceController>();
    final auth = context.watch<AuthController>();
    final parents = finance.categories.where((item) => item.parentId == null).toList();
    return PageStack(
      children: [
        PageHeader(
          title: 'Categories',
          description: 'Icons and colors stay consistent across the app. Categories in use cannot be deleted.',
          actions: FilledButton(onPressed: () => _edit(context), child: const Text('Add category')),
        ),
        for (final item in parents)
          AppCard(
            child: Row(
              children: [
                CategoryGlyph(name: item.icon, color: item.color),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(item.name, style: const TextStyle(fontWeight: FontWeight.w500)),
                      Text(item.kind.value, style: TextStyle(fontSize: 12, color: context.aureum.label)),
                      Wrap(
                        spacing: 6,
                        children: [
                          for (final child in finance.categories.where((c) => c.parentId == item.id))
                            ActionChip(label: Text(child.name), onPressed: () => _edit(context, child)),
                        ],
                      ),
                    ],
                  ),
                ),
                TextButton(onPressed: () => _edit(context, item), child: const Text('Edit')),
                TextButton(
                  onPressed: () async {
                    final confirmed = await ConfirmDialog.show(
                      context,
                      title: 'Delete category?',
                      description: 'This is blocked if transactions still use the category.',
                      confirmLabel: 'Delete',
                      destructive: true,
                    );
                    if (!confirmed) return;
                    try {
                      await auth.client.deleteCategory(item.id);
                      await finance.refresh();
                      if (context.mounted) showSnack(context, 'Category deleted');
                    } catch (error) {
                      if (context.mounted) showSnack(context, toUserMessage(error), error: true);
                    }
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

class AccountsPage extends StatelessWidget {
  const AccountsPage({super.key});

  Future<void> _edit(BuildContext context, [Account? item]) async {
    final auth = context.read<AuthController>();
    final finance = context.read<FinanceController>();
    final name = TextEditingController(text: item?.name ?? '');
    var type = item?.type ?? AccountType.bank;
    final opening = TextEditingController(text: (item?.openingBalance ?? 0).toString());
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
                  Text(item == null ? 'New account' : 'Edit account', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 12),
                  TextField(controller: name, decoration: const InputDecoration(labelText: 'Name')),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<AccountType>(
                    initialValue: type,
                    decoration: const InputDecoration(labelText: 'Type'),
                    items: const [
                      DropdownMenuItem(value: AccountType.cash, child: Text('Cash')),
                      DropdownMenuItem(value: AccountType.bank, child: Text('Bank')),
                      DropdownMenuItem(value: AccountType.credit, child: Text('Credit card')),
                      DropdownMenuItem(value: AccountType.savings, child: Text('Savings')),
                      DropdownMenuItem(value: AccountType.wallet, child: Text('Digital wallet')),
                    ],
                    onChanged: (value) => setModal(() => type = value ?? type),
                  ),
                  const SizedBox(height: 12),
                  TextField(controller: opening, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: 'Opening balance')),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: () async {
                      try {
                        final payload = {
                          'name': name.text.trim(),
                          'type': type.value,
                          'openingBalance': double.tryParse(opening.text) ?? 0,
                          'currency': auth.user?.currency ?? 'USD',
                          'icon': item?.icon ?? 'Landmark',
                          'color': item?.color ?? '#3B82F6',
                        };
                        if (item == null) {
                          await auth.client.createAccount({...payload, 'status': 'active'});
                          if (context.mounted) showSnack(context, 'Account created');
                        } else {
                          await auth.client.updateAccount(item.id, payload);
                          if (context.mounted) showSnack(context, 'Account updated');
                        }
                        await finance.refresh();
                        if (context.mounted) Navigator.pop(context);
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
          title: 'Accounts',
          description: 'Wallets, banks, and cards. Transfers move money without counting as income or expense.',
          actions: FilledButton(onPressed: () => _edit(context), child: const Text('Add account')),
        ),
        if (finance.accounts.isEmpty)
          EmptyState(
            icon: Icons.account_balance_outlined,
            title: 'No accounts yet',
            description: 'Create at least one account before adding transactions.',
            action: FilledButton(onPressed: () => _edit(context), child: const Text('Add account')),
          )
        else
          for (final account in finance.accounts)
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(account.name, style: const TextStyle(fontWeight: FontWeight.w500)),
                            Text('${account.type.value} · ${account.status.value}', style: TextStyle(fontSize: 12, color: context.aureum.label)),
                          ],
                        ),
                      ),
                      CurrencyText(
                        amount: accountBalance(account, finance.transactions),
                        currency: account.currency,
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      OutlinedButton(onPressed: () => _edit(context, account), child: const Text('Edit')),
                      const SizedBox(width: 8),
                      OutlinedButton(
                        onPressed: () async {
                          await auth.client.updateAccount(account.id, {
                            'status': account.status == AccountStatus.active ? 'archived' : 'active',
                          });
                          await finance.refresh();
                        },
                        child: Text(account.status == AccountStatus.active ? 'Archive' : 'Restore'),
                      ),
                      TextButton(
                        onPressed: () async {
                          final confirmed = await ConfirmDialog.show(
                            context,
                            title: 'Delete account?',
                            description: 'Accounts with transactions cannot be deleted.',
                            confirmLabel: 'Delete',
                            destructive: true,
                          );
                          if (!confirmed) return;
                          try {
                            await auth.client.deleteAccountRecord(account.id);
                            await finance.refresh();
                            if (context.mounted) showSnack(context, 'Account deleted');
                          } catch (error) {
                            if (context.mounted) showSnack(context, toUserMessage(error), error: true);
                          }
                        },
                        child: const Text('Delete'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
      ],
    );
  }
}
