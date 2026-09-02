import '../models/models.dart';
import 'dates.dart';

List<Transaction> applyTransactionFilters(
  Iterable<Transaction> transactions,
  TransactionFilters filters, [
  DateRange? range,
]) {
  return transactions.where((tx) {
    if (range != null && !inRange(tx.date, range)) return false;
    if (filters.dateFrom != null && tx.date.compareTo(filters.dateFrom!) < 0) return false;
    if (filters.dateTo != null && tx.date.compareTo(filters.dateTo!) > 0) return false;
    if (filters.type != null && tx.type != filters.type) return false;
    if (filters.categoryId != null &&
        tx.categoryId != filters.categoryId &&
        tx.subcategoryId != filters.categoryId) {
      return false;
    }
    if (filters.accountId != null && tx.accountId != filters.accountId && tx.toAccountId != filters.accountId) {
      return false;
    }
    if (filters.paymentMethod != null && tx.paymentMethod != filters.paymentMethod) return false;
    if (filters.tag != null && !tx.tags.contains(filters.tag)) return false;
    if (filters.amountMin != null && tx.amount < filters.amountMin!) return false;
    if (filters.amountMax != null && tx.amount > filters.amountMax!) return false;
    if (filters.query != null && filters.query!.trim().isNotEmpty) {
      final q = filters.query!.trim().toLowerCase();
      final haystack = [tx.merchant, tx.description, tx.notes, ...tx.tags].join(' ').toLowerCase();
      if (!haystack.contains(q)) return false;
    }
    return true;
  }).toList();
}

List<Transaction> searchTransactions(
  Iterable<Transaction> transactions,
  String query,
  Map<String, String> categoryNames,
) {
  final q = query.trim().toLowerCase();
  if (q.isEmpty) return transactions.toList();
  return transactions.where((tx) {
    final category = tx.categoryId != null ? (categoryNames[tx.categoryId] ?? '') : '';
    final subcategory = tx.subcategoryId != null ? (categoryNames[tx.subcategoryId] ?? '') : '';
    return [tx.merchant, tx.description, tx.notes, category, subcategory, ...tx.tags]
        .join(' ')
        .toLowerCase()
        .contains(q);
  }).toList();
}

List<Transaction> sortTransactions(
  Iterable<Transaction> transactions, [
  TransactionSortField field = TransactionSortField.date,
  SortDirection direction = SortDirection.desc,
]) {
  final copy = [...transactions];
  copy.sort((a, b) {
    late final int result;
    switch (field) {
      case TransactionSortField.amount:
        result = a.amount.compareTo(b.amount);
      case TransactionSortField.merchant:
        result = a.merchant.compareTo(b.merchant);
      case TransactionSortField.createdAt:
        result = a.createdAt.compareTo(b.createdAt);
      case TransactionSortField.date:
        result = a.date.compareTo(b.date);
    }
    return direction == SortDirection.asc ? result : -result;
  });
  return copy;
}
