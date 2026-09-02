import '../models/models.dart';
import 'dates.dart';
import 'utils.dart';

class SampleData {
  const SampleData({
    required this.accounts,
    required this.transactionsFor,
    required this.budgets,
    required this.goals,
  });

  final List<Account> accounts;
  final List<Transaction> Function(List<Category> categories) transactionsFor;
  final List<Budget> Function(List<Category> categories) budgets;
  final List<Goal> goals;
}

SampleData buildSampleData(String userId, String currency) {
  final now = DateTime.now();
  final monthStart = startOfMonth(now);
  final iso = now.toIso8601String();

  final accounts = [
    Account(
      id: createId(),
      userId: userId,
      name: 'Everyday checking',
      type: AccountType.bank,
      openingBalance: 2400,
      currency: currency,
      icon: 'Landmark',
      color: '#3B82F6',
      status: AccountStatus.active,
      createdAt: iso,
      updatedAt: iso,
    ),
    Account(
      id: createId(),
      userId: userId,
      name: 'Cash',
      type: AccountType.cash,
      openingBalance: 180,
      currency: currency,
      icon: 'Banknote',
      color: '#22D3EE',
      status: AccountStatus.active,
      createdAt: iso,
      updatedAt: iso,
    ),
  ];

  String? findCategory(List<Category> categories, String name) {
    for (final item in categories) {
      if (item.name == name) return item.id;
    }
    return null;
  }

  const merchants = [
    (merchant: 'Green Market', category: 'Food', amount: 42.5, daysAgo: 1),
    (merchant: 'City Transit', category: 'Transport', amount: 18.0, daysAgo: 2),
    (merchant: 'Northwind Cafe', category: 'Food', amount: 14.75, daysAgo: 3),
    (merchant: 'Streamflix', category: 'Entertainment', amount: 15.99, daysAgo: 4),
    (merchant: 'Metro Pharmacy', category: 'Health', amount: 28.4, daysAgo: 6),
    (merchant: 'Aether Apparel', category: 'Shopping', amount: 86.0, daysAgo: 8),
    (merchant: 'Harbor Utilities', category: 'Bills', amount: 64.2, daysAgo: 10),
    (merchant: 'Oak Street Rent', category: 'Housing', amount: 1200.0, daysAgo: 12),
    (merchant: 'Daily Grind', category: 'Food', amount: 6.5, daysAgo: 13),
    (merchant: 'Airport Express', category: 'Travel', amount: 48.0, daysAgo: 18),
  ];

  List<Transaction> transactionsFor(List<Category> categories) {
    final salary = categories.cast<Category?>().firstWhere(
          (item) => item!.name == 'Salary',
          orElse: () => null,
        );
    final list = <Transaction>[
      for (var index = 0; index < merchants.length; index++)
        Transaction(
          id: createId(),
          userId: userId,
          type: TransactionType.expense,
          amount: merchants[index].amount,
          currency: currency,
          categoryId: findCategory(categories, merchants[index].category),
          subcategoryId: null,
          accountId: accounts[index % 2].id,
          toAccountId: null,
          merchant: merchants[index].merchant,
          description: '',
          notes: 'Sample data',
          date: toISODate(now.subtract(Duration(days: merchants[index].daysAgo))),
          paymentMethod: index % 2 == 0 ? PaymentMethod.card : PaymentMethod.upi,
          tags: const ['sample'],
          recurringId: null,
          attachmentPath: null,
          attachmentName: null,
          isSample: true,
          createdAt: iso,
          updatedAt: iso,
        ),
    ];

    list.add(
      Transaction(
        id: createId(),
        userId: userId,
        type: TransactionType.income,
        amount: 4200,
        currency: currency,
        categoryId: salary?.id,
        subcategoryId: null,
        accountId: accounts[0].id,
        toAccountId: null,
        merchant: 'Northwind Inc.',
        description: 'Monthly salary',
        notes: 'Sample data',
        date: toISODate(monthStart.add(const Duration(days: 1))),
        paymentMethod: PaymentMethod.bankTransfer,
        tags: const ['sample'],
        recurringId: null,
        attachmentPath: null,
        attachmentName: null,
        isSample: true,
        createdAt: iso,
        updatedAt: iso,
      ),
    );

    final previousMonth = startOfMonth(DateTime(now.year, now.month - 1, 1));
    list.add(
      Transaction(
        id: createId(),
        userId: userId,
        type: TransactionType.income,
        amount: 3800,
        currency: currency,
        categoryId: salary?.id,
        subcategoryId: null,
        accountId: accounts[0].id,
        toAccountId: null,
        merchant: 'Northwind Inc.',
        description: 'Monthly salary',
        notes: 'Sample data',
        date: toISODate(previousMonth.add(const Duration(days: 1))),
        paymentMethod: PaymentMethod.bankTransfer,
        tags: const ['sample'],
        recurringId: null,
        attachmentPath: null,
        attachmentName: null,
        isSample: true,
        createdAt: iso,
        updatedAt: iso,
      ),
    );
    return list;
  }

  List<Budget> budgets(List<Category> categories) => [
        Budget(
          id: createId(),
          userId: userId,
          name: 'Monthly food',
          categoryId: findCategory(categories, 'Food'),
          limitAmount: 400,
          period: BudgetPeriod.monthly,
          startDate: toISODate(monthStart),
          endDate: null,
          alertThreshold: 80,
          createdAt: iso,
          updatedAt: iso,
        ),
        Budget(
          id: createId(),
          userId: userId,
          name: 'Overall monthly',
          categoryId: null,
          limitAmount: 2200,
          period: BudgetPeriod.monthly,
          startDate: toISODate(monthStart),
          endDate: null,
          alertThreshold: 85,
          createdAt: iso,
          updatedAt: iso,
        ),
      ];

  final goals = [
    Goal(
      id: createId(),
      userId: userId,
      name: 'Emergency fund',
      targetAmount: 6000,
      currentAmount: 1450,
      deadline: toISODate(now.add(const Duration(days: 180))),
      icon: 'Shield',
      color: '#A855F7',
      createdAt: iso,
      updatedAt: iso,
    ),
  ];

  return SampleData(
    accounts: accounts,
    transactionsFor: transactionsFor,
    budgets: budgets,
    goals: goals,
  );
}
