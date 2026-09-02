import '../models/models.dart';

int toCents(double amount) {
  if (!amount.isFinite) return 0;
  return (amount * 100).round();
}

double fromCents(int cents) => cents / 100;

double addAmounts(Iterable<double> amounts) {
  return fromCents(amounts.fold<int>(0, (sum, value) => sum + toCents(value)));
}

double subtractAmount(double left, double right) => fromCents(toCents(left) - toCents(right));

double sumBy<T>(Iterable<T> items, double Function(T item) pick) {
  return fromCents(items.fold<int>(0, (sum, item) => sum + toCents(pick(item))));
}

double? percentChange(double current, double previous) {
  if (toCents(previous) == 0) {
    return toCents(current) == 0 ? 0 : null;
  }
  return ((current - previous) / previous.abs()) * 100;
}

double savingsRate(double income, double expenses) {
  if (toCents(income) == 0) return 0;
  return ((income - expenses) / income) * 100;
}

double usagePercent(double spent, double limit) {
  if (toCents(limit) <= 0) return 0;
  return (spent / limit) * 100;
}

double remaining(double limit, double spent) => subtractAmount(limit, spent);

double projectedSpend(double spent, int elapsedDays, int totalDays) {
  if (elapsedDays <= 0) return spent;
  return fromCents(((toCents(spent) / elapsedDays) * totalDays).round());
}

double requiredMonthlySavings(double remainingAmount, DateTime deadline, [DateTime? now]) {
  final current = now ?? DateTime.now();
  final months = [
    1,
    (deadline.year - current.year) * 12 + (deadline.month - current.month),
  ].reduce((a, b) => a > b ? a : b);
  return fromCents((toCents(remainingAmount < 0 ? 0 : remainingAmount) / months).ceil());
}

FinanceTotals computeTotals(Iterable<Transaction> transactions) {
  final income = sumBy(transactions.where((item) => item.type == TransactionType.income), (item) => item.amount);
  final expenses = sumBy(transactions.where((item) => item.type == TransactionType.expense), (item) => item.amount);
  final transfers = sumBy(transactions.where((item) => item.type == TransactionType.transfer), (item) => item.amount);
  final savings = subtractAmount(income, expenses);
  return FinanceTotals(
    income: income,
    expenses: expenses,
    transfers: transfers,
    savings: savings,
    savingsRate: savingsRate(income, expenses),
  );
}

double accountBalance(Account account, Iterable<Transaction> transactions) {
  var cents = toCents(account.openingBalance);
  for (final tx in transactions) {
    if (tx.type == TransactionType.transfer) {
      if (tx.accountId == account.id) cents -= toCents(tx.amount);
      if (tx.toAccountId == account.id) cents += toCents(tx.amount);
      continue;
    }
    if (tx.accountId != account.id) continue;
    if (tx.type == TransactionType.income) cents += toCents(tx.amount);
    if (tx.type == TransactionType.expense) {
      cents += account.type == AccountType.credit ? toCents(tx.amount) : -toCents(tx.amount);
    }
  }
  return fromCents(cents);
}

Map<String, double> categoryTotals(Iterable<Transaction> transactions) {
  final totals = <String, double>{};
  for (final tx in transactions) {
    if (tx.type == TransactionType.transfer || tx.categoryId == null) continue;
    totals[tx.categoryId!] = addAmounts([totals[tx.categoryId!] ?? 0, tx.amount]);
  }
  return totals;
}
