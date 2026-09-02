import 'package:aureum/core/money.dart';
import 'package:aureum/models/models.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('computes in cents so 0.1 + 0.2 is exact', () {
    expect(addAmounts([0.1, 0.2]), 0.3);
    expect(subtractAmount(10.00, 0.01), 9.99);
  });

  test('percentChange is null when previous is zero and current is not', () {
    expect(percentChange(10, 0), isNull);
    expect(percentChange(0, 0), 0);
    expect(percentChange(120, 100), 20);
  });

  test('transfers never count toward income or expense totals', () {
    final totals = computeTotals([
      _tx(TransactionType.income, 100),
      _tx(TransactionType.expense, 40),
      _tx(TransactionType.transfer, 25),
    ]);
    expect(totals.income, 100);
    expect(totals.expenses, 40);
    expect(totals.transfers, 25);
    expect(totals.savings, 60);
  });

  test('credit card expenses increase the displayed balance', () {
    final credit = Account(
      id: 'c',
      userId: 'u',
      name: 'Card',
      type: AccountType.credit,
      openingBalance: 0,
      currency: 'USD',
      icon: 'CreditCard',
      color: '#3B82F6',
      status: AccountStatus.active,
      createdAt: '',
      updatedAt: '',
    );
    final bank = Account(
      id: 'b',
      userId: 'u',
      name: 'Bank',
      type: AccountType.bank,
      openingBalance: 100,
      currency: 'USD',
      icon: 'Landmark',
      color: '#3B82F6',
      status: AccountStatus.active,
      createdAt: '',
      updatedAt: '',
    );
    final txs = [
      Transaction(
        id: '1',
        userId: 'u',
        type: TransactionType.expense,
        amount: 20,
        currency: 'USD',
        categoryId: null,
        subcategoryId: null,
        accountId: 'c',
        toAccountId: null,
        merchant: 'Shop',
        description: '',
        notes: '',
        date: '2026-09-01',
        paymentMethod: PaymentMethod.card,
        tags: const [],
        recurringId: null,
        attachmentPath: null,
        attachmentName: null,
        isSample: false,
        createdAt: '',
        updatedAt: '',
      ),
      Transaction(
        id: '2',
        userId: 'u',
        type: TransactionType.expense,
        amount: 20,
        currency: 'USD',
        categoryId: null,
        subcategoryId: null,
        accountId: 'b',
        toAccountId: null,
        merchant: 'Shop',
        description: '',
        notes: '',
        date: '2026-09-01',
        paymentMethod: PaymentMethod.card,
        tags: const [],
        recurringId: null,
        attachmentPath: null,
        attachmentName: null,
        isSample: false,
        createdAt: '',
        updatedAt: '',
      ),
    ];
    expect(accountBalance(credit, txs), 20);
    expect(accountBalance(bank, txs), 80);
  });
}

Transaction _tx(TransactionType type, double amount) {
  return Transaction(
    id: type.name,
    userId: 'u',
    type: type,
    amount: amount,
    currency: 'USD',
    categoryId: null,
    subcategoryId: null,
    accountId: 'a',
    toAccountId: type == TransactionType.transfer ? 'b' : null,
    merchant: '',
    description: '',
    notes: '',
    date: '2026-09-01',
    paymentMethod: PaymentMethod.card,
    tags: const [],
    recurringId: null,
    attachmentPath: null,
    attachmentName: null,
    isSample: false,
    createdAt: '',
    updatedAt: '',
  );
}
