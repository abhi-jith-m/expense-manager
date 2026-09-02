import 'package:flutter/material.dart';

import '../core/currency.dart';
import '../core/dates.dart';
import '../models/models.dart';

class TransactionFormResult {
  const TransactionFormResult({
    required this.type,
    required this.amount,
    required this.currency,
    required this.categoryId,
    required this.subcategoryId,
    required this.accountId,
    required this.toAccountId,
    required this.merchant,
    required this.notes,
    required this.date,
    required this.paymentMethod,
    required this.tags,
  });

  final TransactionType type;
  final double amount;
  final String currency;
  final String? categoryId;
  final String? subcategoryId;
  final String accountId;
  final String? toAccountId;
  final String merchant;
  final String notes;
  final String date;
  final PaymentMethod paymentMethod;
  final List<String> tags;

  CreateTransactionInput toInput({TransactionType? typeOverride, String? toAccountOverride}) {
    return CreateTransactionInput(
      type: typeOverride ?? type,
      amount: amount,
      currency: currency,
      categoryId: categoryId,
      subcategoryId: subcategoryId,
      accountId: accountId,
      toAccountId: toAccountOverride ?? toAccountId,
      merchant: merchant,
      description: '',
      notes: notes,
      date: date,
      paymentMethod: paymentMethod,
      tags: tags,
      recurringId: null,
      attachmentPath: null,
      attachmentName: null,
      isSample: false,
    );
  }
}

class TransactionForm extends StatefulWidget {
  const TransactionForm({
    super.key,
    required this.accounts,
    required this.categories,
    required this.defaultType,
    required this.defaultCurrency,
    required this.onSubmit,
    this.initial,
    this.submitting = false,
    this.autofocusAmount = false,
  });

  final List<Account> accounts;
  final List<Category> categories;
  final TransactionType defaultType;
  final String defaultCurrency;
  final Transaction? initial;
  final bool submitting;
  final bool autofocusAmount;
  final Future<void> Function(TransactionFormResult values) onSubmit;

  @override
  State<TransactionForm> createState() => _TransactionFormState();
}

class _TransactionFormState extends State<TransactionForm> {
  late TransactionType type;
  late final TextEditingController amount;
  late String currency;
  String? categoryId;
  String? subcategoryId;
  String? accountId;
  String? toAccountId;
  late final TextEditingController merchant;
  late final TextEditingController notes;
  late final TextEditingController tags;
  late DateTime date;
  late PaymentMethod paymentMethod;
  String? error;

  @override
  void initState() {
    super.initState();
    final initial = widget.initial;
    type = initial?.type ?? widget.defaultType;
    amount = TextEditingController(text: initial?.amount.toString() ?? '');
    currency = initial?.currency ?? widget.defaultCurrency;
    categoryId = initial?.categoryId;
    subcategoryId = initial?.subcategoryId;
    accountId = initial?.accountId ?? (widget.accounts.isNotEmpty ? widget.accounts.first.id : null);
    toAccountId = initial?.toAccountId;
    merchant = TextEditingController(text: initial?.merchant ?? '');
    notes = TextEditingController(text: initial?.notes ?? '');
    tags = TextEditingController(text: initial?.tags.join(', ') ?? '');
    date = parseDate(initial?.date ?? '') ?? DateTime.now();
    paymentMethod = initial?.paymentMethod ?? PaymentMethod.card;
  }

  @override
  void dispose() {
    amount.dispose();
    merchant.dispose();
    notes.dispose();
    tags.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final parsed = double.tryParse(amount.text);
    if (parsed == null || parsed <= 0) {
      setState(() => error = 'Amount must be greater than zero');
      return;
    }
    if (accountId == null || accountId!.isEmpty) {
      setState(() => error = 'Select an account');
      return;
    }
    if (type == TransactionType.transfer && (toAccountId == null || toAccountId == accountId)) {
      setState(() => error = 'Choose a different destination account');
      return;
    }
    setState(() => error = null);
    await widget.onSubmit(
      TransactionFormResult(
        type: type,
        amount: parsed,
        currency: currency,
        categoryId: categoryId,
        subcategoryId: subcategoryId,
        accountId: accountId!,
        toAccountId: type == TransactionType.transfer ? toAccountId : null,
        merchant: merchant.text,
        notes: notes.text,
        date: toISODate(date),
        paymentMethod: paymentMethod,
        tags: tags.text.split(',').map((tag) => tag.trim()).where((tag) => tag.isNotEmpty).toList(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final parentCategories = widget.categories.where((item) {
      return item.parentId == null && (type == TransactionType.transfer || item.kind.name == type.value);
    }).toList();
    final subcategories = widget.categories.where((item) => item.parentId == categoryId).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SegmentedButton<TransactionType>(
          segments: const [
            ButtonSegment(value: TransactionType.expense, label: Text('Expense')),
            ButtonSegment(value: TransactionType.income, label: Text('Income')),
            ButtonSegment(value: TransactionType.transfer, label: Text('Transfer')),
          ],
          selected: {type},
          onSelectionChanged: (value) => setState(() {
            type = value.first;
            categoryId = null;
            subcategoryId = null;
          }),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: amount,
          autofocus: widget.autofocusAmount,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          decoration: InputDecoration(labelText: 'Amount', prefixText: '${getCurrency(currency).symbol} '),
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          initialValue: currency,
          decoration: const InputDecoration(labelText: 'Currency'),
          items: [
            for (final item in currencies)
              DropdownMenuItem(value: item.code, child: Text('${item.code} · ${item.name}')),
          ],
          onChanged: (value) => setState(() => currency = value ?? currency),
        ),
        const SizedBox(height: 12),
        ListTile(
          contentPadding: EdgeInsets.zero,
          title: const Text('Date'),
          subtitle: Text(toISODate(date)),
          trailing: const Icon(Icons.calendar_today_outlined),
          onTap: () async {
            final next = await showDatePicker(
              context: context,
              initialDate: date,
              firstDate: DateTime(2000),
              lastDate: DateTime(2100),
            );
            if (next != null) setState(() => date = next);
          },
        ),
        if (type != TransactionType.transfer) ...[
          DropdownButtonFormField<String>(
            initialValue: categoryId,
            decoration: const InputDecoration(labelText: 'Category'),
            items: [
              const DropdownMenuItem(value: null, child: Text('None')),
              for (final item in parentCategories) DropdownMenuItem(value: item.id, child: Text(item.name)),
            ],
            onChanged: (value) => setState(() {
              categoryId = value;
              subcategoryId = null;
            }),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: subcategoryId,
            decoration: const InputDecoration(labelText: 'Subcategory'),
            items: [
              const DropdownMenuItem(value: null, child: Text('None')),
              for (final item in subcategories) DropdownMenuItem(value: item.id, child: Text(item.name)),
            ],
            onChanged: subcategories.isEmpty ? null : (value) => setState(() => subcategoryId = value),
          ),
          const SizedBox(height: 12),
        ],
        DropdownButtonFormField<String>(
          initialValue: accountId,
          decoration: InputDecoration(labelText: type == TransactionType.transfer ? 'From account' : 'Account'),
          items: [
            for (final item in widget.accounts) DropdownMenuItem(value: item.id, child: Text(item.name)),
          ],
          onChanged: widget.accounts.isEmpty ? null : (value) => setState(() => accountId = value),
        ),
        const SizedBox(height: 12),
        if (type == TransactionType.transfer)
          DropdownButtonFormField<String>(
            initialValue: toAccountId,
            decoration: const InputDecoration(labelText: 'To account'),
            items: [
              for (final item in widget.accounts) DropdownMenuItem(value: item.id, child: Text(item.name)),
            ],
            onChanged: (value) => setState(() => toAccountId = value),
          )
        else
          DropdownButtonFormField<PaymentMethod>(
            initialValue: paymentMethod,
            decoration: const InputDecoration(labelText: 'Payment method'),
            items: [
              for (final item in PaymentMethod.values)
                DropdownMenuItem(value: item, child: Text(item.label)),
            ],
            onChanged: (value) => setState(() => paymentMethod = value ?? paymentMethod),
          ),
        const SizedBox(height: 12),
        TextField(
          controller: merchant,
          decoration: InputDecoration(labelText: type == TransactionType.income ? 'Source' : 'Merchant'),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: tags,
          decoration: const InputDecoration(labelText: 'Tags', hintText: 'comma, separated'),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: notes,
          maxLines: 3,
          decoration: const InputDecoration(labelText: 'Notes'),
        ),
        if (error != null) ...[
          const SizedBox(height: 8),
          Text(error!, style: TextStyle(color: Theme.of(context).colorScheme.error, fontSize: 12)),
        ],
        const SizedBox(height: 16),
        FilledButton(
          onPressed: widget.submitting || widget.accounts.isEmpty ? null : _submit,
          child: Text(widget.submitting ? 'Saving…' : widget.initial != null ? 'Save changes' : 'Save transaction'),
        ),
      ],
    );
  }
}
