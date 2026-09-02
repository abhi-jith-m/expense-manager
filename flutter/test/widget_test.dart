import 'package:aureum/core/filters.dart';
import 'package:aureum/models/models.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('search and sort match the web filter rules', () {
    final txs = [
      _tx('1', 'Green Market', 12, '2026-09-02'),
      _tx('2', 'City Transit', 8, '2026-09-01'),
    ];
    final found = searchTransactions(txs, 'green', {});
    expect(found.single.merchant, 'Green Market');
    final sorted = sortTransactions(txs, TransactionSortField.amount, SortDirection.asc);
    expect(sorted.first.amount, 8);
  });
}

Transaction _tx(String id, String merchant, double amount, String date) {
  return Transaction(
    id: id,
    userId: 'u',
    type: TransactionType.expense,
    amount: amount,
    currency: 'USD',
    categoryId: null,
    subcategoryId: null,
    accountId: 'a',
    toAccountId: null,
    merchant: merchant,
    description: '',
    notes: '',
    date: date,
    paymentMethod: PaymentMethod.card,
    tags: const [],
    recurringId: null,
    attachmentPath: null,
    attachmentName: null,
    isSample: false,
    createdAt: date,
    updatedAt: date,
  );
}
