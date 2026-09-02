import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/dates.dart';
import '../core/errors.dart';
import '../core/filters.dart';
import '../models/models.dart';
import '../state/auth_controller.dart';
import '../state/finance_controller.dart';
import '../widgets/app_widgets.dart';
import '../widgets/transaction_form.dart';

class TransactionsPage extends StatefulWidget {
  const TransactionsPage({super.key});

  @override
  State<TransactionsPage> createState() => _TransactionsPageState();
}

class _TransactionsPageState extends State<TransactionsPage> {
  TransactionFilters filters = const TransactionFilters();
  TransactionSortField sortField = TransactionSortField.date;
  final selected = <String>{};
  String query = '';
  final search = SearchController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _openEditFromQuery());
  }

  @override
  void dispose() {
    search.dispose();
    super.dispose();
  }

  void _openEditFromQuery() {
    final id = GoRouterState.of(context).uri.queryParameters['edit'];
    if (id == null) return;
    final finance = context.read<FinanceController>();
    Transaction? requested;
    for (final item in finance.transactions) {
      if (item.id == id) requested = item;
    }
    if (requested != null) _openForm(requested);
  }

  Future<void> _openForm([Transaction? editing]) async {
    final auth = context.read<AuthController>();
    final finance = context.read<FinanceController>();
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(editing == null ? 'Add expense' : 'Edit transaction', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 16),
                TransactionForm(
                  accounts: finance.accounts,
                  categories: finance.categories,
                  defaultType: TransactionType.expense,
                  defaultCurrency: auth.user?.currency ?? 'USD',
                  initial: editing,
                  autofocusAmount: editing == null,
                  onSubmit: (values) async {
                    try {
                      if (editing == null) {
                        await auth.client.createTransaction(values.toInput());
                        if (context.mounted) showSnack(context, 'Transaction added');
                      } else {
                        await auth.client.updateTransaction(editing.id, values.toInput().toJson());
                        if (context.mounted) showSnack(context, 'Transaction updated');
                      }
                      appHaptic(true);
                      await finance.refresh();
                      if (context.mounted) Navigator.pop(context);
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

  Future<void> _openFilters() async {
    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Filters', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 12),
                SegmentedButton<TransactionType?>(
                  segments: const [
                    ButtonSegment(value: null, label: Text('All')),
                    ButtonSegment(value: TransactionType.expense, label: Text('Expense')),
                    ButtonSegment(value: TransactionType.income, label: Text('Income')),
                    ButtonSegment(value: TransactionType.transfer, label: Text('Transfer')),
                  ],
                  selected: {filters.type},
                  onSelectionChanged: (value) {
                    setState(() => filters = filters.copyWith(type: value.first, clearType: value.first == null));
                    Navigator.pop(context);
                  },
                ),
                const SizedBox(height: 16),
                Text('Sort', style: Theme.of(context).textTheme.titleSmall),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  children: [
                    for (final option in const [
                      (TransactionSortField.date, 'Date'),
                      (TransactionSortField.amount, 'Amount'),
                      (TransactionSortField.merchant, 'Merchant'),
                    ])
                      FilterChip(
                        label: Text(option.$2),
                        selected: sortField == option.$1,
                        onSelected: (_) {
                          setState(() => sortField = option.$1);
                          Navigator.pop(context);
                        },
                      ),
                  ],
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
    final finance = context.watch<FinanceController>();
    final categoryNames = {for (final item in finance.categories) item.id: item.name};
    final filtered = sortTransactions(
      searchTransactions(applyTransactionFilters(finance.transactions, filters.copyWith(query: null)), query, categoryNames),
      sortField,
    );

    return RefreshIndicator(
      onRefresh: finance.refresh,
      child: Column(
        children: [
          Padding(
            padding: EdgeInsets.fromLTRB(context.density.pagePadding.left, 4, context.density.pagePadding.right, 8),
            child: Row(
              children: [
                Expanded(
                  child: SearchBar(
                    controller: search,
                    hintText: 'Search merchant or category',
                    leading: const Icon(Icons.search),
                    onChanged: (value) => setState(() => query = value),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filledTonal(
                  tooltip: 'Filters',
                  onPressed: _openFilters,
                  icon: const Icon(Icons.tune),
                ),
              ],
            ),
          ),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: EdgeInsets.symmetric(horizontal: context.density.pagePadding.left),
            child: Row(
              children: [
                FilterChip(
                  label: Text(filters.type?.value ?? 'All types'),
                  selected: filters.type != null,
                  onSelected: (_) => _openFilters(),
                ),
                const SizedBox(width: 8),
                FilterChip(label: Text(sortField.name), selected: true, onSelected: (_) => _openFilters()),
              ],
            ),
          ),
          if (selected.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
              child: AppCard(
                child: Row(
                  children: [
                    Expanded(child: Text('${selected.length} selected', overflow: TextOverflow.ellipsis)),
                    TextButton(
                      onPressed: () async {
                        final confirmed = await ConfirmDialog.show(
                          context,
                          title: 'Delete transactions?',
                          description: 'This permanently removes the selected transactions.',
                          confirmLabel: 'Delete',
                          destructive: true,
                        );
                        if (!confirmed || !context.mounted) return;
                        await context.read<AuthController>().client.deleteTransactions(selected.toList());
                        selected.clear();
                        await finance.refresh();
                        if (context.mounted) showSnack(context, 'Deleted');
                      },
                      child: const Text('Delete'),
                    ),
                  ],
                ),
              ),
            ),
          Expanded(
            child: filtered.isEmpty
                ? ListView(
                    children: [
                      EmptyState(
                        icon: Icons.inbox_outlined,
                        title: 'No matching transactions',
                        description: 'Adjust filters or add an expense to see it here.',
                        action: FilledButton(onPressed: () => _openForm(), child: const Text('Add expense')),
                      ),
                    ],
                  )
                : ListView.builder(
                    padding: context.density.pagePadding,
                    itemCount: filtered.length + 1,
                    itemBuilder: (context, index) {
                      if (index == filtered.length) {
                        return Padding(
                          padding: const EdgeInsets.only(top: 8, bottom: 72),
                          child: Text(
                            '${filtered.length} transaction${filtered.length == 1 ? '' : 's'}',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        );
                      }
                      final tx = filtered[index];
                      return TransactionRow(
                        merchant: tx.merchant.isEmpty ? 'Untitled' : tx.merchant,
                        meta: '${finance.categoryMap[tx.categoryId ?? '']?.name ?? tx.type.value} · ${formatDate(tx.date, context.read<AuthController>().user?.dateFormat ?? 'MMM d, yyyy')}',
                        amount: tx.amount,
                        currency: tx.currency,
                        icon: finance.categoryMap[tx.categoryId ?? '']?.icon,
                        color: finance.categoryMap[tx.categoryId ?? '']?.color,
                        tone: tx.type.value,
                        onTap: () => _openForm(tx),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
