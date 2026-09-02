import 'package:csv/csv.dart';
import 'package:intl/intl.dart';

import '../models/models.dart';
import 'currency.dart';
import 'dates.dart';

class ImportField {
  const ImportField({required this.key, required this.label, required this.requiredField});

  final String key;
  final String label;
  final bool requiredField;
}

const importFields = [
  ImportField(key: 'date', label: 'Date', requiredField: true),
  ImportField(key: 'amount', label: 'Amount', requiredField: true),
  ImportField(key: 'type', label: 'Type', requiredField: false),
  ImportField(key: 'merchant', label: 'Merchant', requiredField: false),
  ImportField(key: 'category', label: 'Category', requiredField: false),
  ImportField(key: 'account', label: 'Account', requiredField: false),
  ImportField(key: 'description', label: 'Description', requiredField: false),
  ImportField(key: 'notes', label: 'Notes', requiredField: false),
  ImportField(key: 'paymentMethod', label: 'Payment method', requiredField: false),
  ImportField(key: 'tags', label: 'Tags', requiredField: false),
];

Map<String, String> detectColumns(List<String> headers) {
  final mapping = <String, String>{for (final field in importFields) field.key: ''};
  final normalized = headers.map((header) => header.trim()).toList();
  const rules = <String, List<String>>{
    'date': ['date', 'transaction date', 'posted', 'value date'],
    'amount': ['amount', 'value', 'debit', 'credit', 'sum'],
    'type': ['type', 'transaction type', 'in/out'],
    'merchant': ['merchant', 'payee', 'name', 'description'],
    'category': ['category', 'label'],
    'account': ['account', 'wallet', 'account name'],
    'description': ['details', 'memo', 'narration'],
    'notes': ['notes', 'note', 'comment'],
    'paymentMethod': ['payment method', 'method', 'mode'],
    'tags': ['tags', 'labels'],
  };
  for (final entry in rules.entries) {
    final match = normalized.cast<String?>().firstWhere(
          (header) => entry.value.contains(header!.toLowerCase()),
          orElse: () => null,
        );
    mapping[entry.key] = match ?? '';
  }
  return mapping;
}

({List<String> headers, List<Map<String, String>> rows}) parseCsvTable(String text) {
  final table = Csv().decode(text);
  if (table.isEmpty) return (headers: <String>[], rows: <Map<String, String>>[]);
  final headers = table.first.map((cell) => '$cell').toList();
  final rows = table.skip(1).map((row) {
    final map = <String, String>{};
    for (var i = 0; i < headers.length; i++) {
      map[headers[i]] = i < row.length ? '${row[i]}' : '';
    }
    return map;
  }).toList();
  return (headers: headers, rows: rows);
}

TransactionType inferType(String raw, double amount) {
  final value = raw.toLowerCase();
  if (value.contains('income') || value.contains('credit') || (amount < 0 && value.contains('in'))) {
    return TransactionType.income;
  }
  if (value.contains('transfer')) return TransactionType.transfer;
  if (amount < 0) return TransactionType.expense;
  if (value.contains('expense') || value.contains('debit')) return TransactionType.expense;
  return amount >= 0 ? TransactionType.expense : TransactionType.income;
}

List<MappedImportRow> mapImportRows(
  List<Map<String, String>> rows,
  Map<String, String> mapping, {
  required String defaultAccountId,
  required String defaultCurrency,
  required List<Category> categories,
  required Map<String, String> accountNames,
}) {
  return [
    for (var index = 0; index < rows.length; index++)
      () {
        final row = rows[index];
        final errors = <ImportRowError>[];
        final dateRaw = mapping['date']?.isNotEmpty == true ? row[mapping['date']] ?? '' : '';
        final amountRaw = mapping['amount']?.isNotEmpty == true ? row[mapping['amount']] ?? '' : '';
        final date = parseDate(dateRaw);
        final amount = parseMoneyInput(amountRaw);
        if (date == null) errors.add(ImportRowError(row: index + 1, field: 'date', message: 'Invalid date'));
        if (amount == null) errors.add(ImportRowError(row: index + 1, field: 'amount', message: 'Invalid amount'));

        final typeRaw = mapping['type']?.isNotEmpty == true ? row[mapping['type']] ?? '' : '';
        final type = inferType(typeRaw, amount ?? 0);
        final categoryName = mapping['category']?.isNotEmpty == true ? row[mapping['category']] ?? '' : '';
        Category? category;
        for (final item in categories) {
          if (item.name.toLowerCase() == categoryName.trim().toLowerCase()) {
            category = item;
            break;
          }
        }
        final accountName = mapping['account']?.isNotEmpty == true ? row[mapping['account']] ?? '' : '';
        String accountId = defaultAccountId;
        accountNames.forEach((id, name) {
          if (name.toLowerCase() == accountName.trim().toLowerCase()) accountId = id;
        });

        final paymentRaw =
            (mapping['paymentMethod']?.isNotEmpty == true ? row[mapping['paymentMethod']] ?? 'card' : 'card')
                .toLowerCase();
        final paymentMethod = PaymentMethodX.parse(paymentRaw);

        return MappedImportRow(
          row: index + 1,
          errors: errors,
          transaction: CreateTransactionInput(
            type: type,
            amount: (amount ?? 0).abs(),
            currency: defaultCurrency,
            categoryId: category?.id,
            subcategoryId: null,
            accountId: accountId,
            toAccountId: null,
            merchant: mapping['merchant']?.isNotEmpty == true ? row[mapping['merchant']] ?? '' : '',
            description: mapping['description']?.isNotEmpty == true ? row[mapping['description']] ?? '' : '',
            notes: mapping['notes']?.isNotEmpty == true ? row[mapping['notes']] ?? '' : '',
            date: date == null ? '' : toISODate(date),
            paymentMethod: paymentMethod,
            tags: mapping['tags']?.isNotEmpty == true
                ? (row[mapping['tags']] ?? '').split(',').map((tag) => tag.trim()).where((tag) => tag.isNotEmpty).toList()
                : const [],
            recurringId: null,
            attachmentPath: null,
            attachmentName: null,
            isSample: false,
          ),
        );
      }(),
  ];
}

String transactionsToCsv(List<Transaction> transactions) {
  final rows = [
    ['date', 'type', 'amount', 'currency', 'merchant', 'description', 'notes', 'payment_method', 'tags'],
    ...transactions.map(
      (tx) => [
        tx.date,
        tx.type.value,
        tx.amount,
        tx.currency,
        tx.merchant,
        tx.description,
        tx.notes,
        tx.paymentMethod.value,
        tx.tags.join(','),
      ],
    ),
  ];
  return Csv().encode(rows);
}

String exportFilename(String kind, String extension) {
  return 'aureum-$kind-${DateFormat('yyyy-MM-dd').format(DateTime.now())}.$extension';
}
