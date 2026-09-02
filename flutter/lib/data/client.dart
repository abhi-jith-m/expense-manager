import 'dart:typed_data';

import '../models/models.dart';

class ReceiptFile {
  const ReceiptFile({required this.bytes, required this.name, required this.mimeType});

  final Uint8List bytes;
  final String name;
  final String mimeType;

  int get size => bytes.length;
}

abstract class DataClient {
  String get backend;

  Future<Session?> getSession();
  VoidAuthListener onAuthChange(void Function(Session? session) listener);
  Future<Session> signUp(String email, String password, String fullName);
  Future<Session> signIn(String email, String password);
  Future<void> signInWithGoogle();
  Future<void> signOut();
  Future<void> requestPasswordReset(String email);
  Future<void> updatePassword(String password);
  Future<Profile> updateProfile(Map<String, dynamic> patch);
  Future<String> uploadAvatar(ReceiptFile file);
  Future<void> deleteAccount();

  Future<List<Account>> listAccounts();
  Future<Account> createAccount(Map<String, dynamic> input);
  Future<Account> updateAccount(String id, Map<String, dynamic> patch);
  Future<void> deleteAccountRecord(String id);

  Future<List<Category>> listCategories();
  Future<Category> createCategory(Map<String, dynamic> input);
  Future<Category> updateCategory(String id, Map<String, dynamic> patch);
  Future<void> deleteCategory(String id);
  Future<void> reorderCategories(List<String> ids);

  Future<List<Transaction>> listTransactions();
  Future<Transaction> createTransaction(CreateTransactionInput input);
  Future<Transaction> updateTransaction(String id, Map<String, dynamic> patch);
  Future<void> deleteTransaction(String id);
  Future<void> deleteTransactions(List<String> ids);
  Future<void> updateTransactions(List<String> ids, Map<String, dynamic> patch);

  Future<List<Budget>> listBudgets();
  Future<Budget> createBudget(Map<String, dynamic> input);
  Future<Budget> updateBudget(String id, Map<String, dynamic> patch);
  Future<void> deleteBudget(String id);

  Future<List<RecurringTransaction>> listRecurring();
  Future<RecurringTransaction> createRecurring(Map<String, dynamic> input);
  Future<RecurringTransaction> updateRecurring(String id, Map<String, dynamic> patch);
  Future<void> deleteRecurring(String id);

  Future<List<Goal>> listGoals();
  Future<Goal> createGoal(Map<String, dynamic> input);
  Future<Goal> updateGoal(String id, Map<String, dynamic> patch);
  Future<void> deleteGoal(String id);

  Future<List<AppNotification>> listNotifications();
  Future<AppNotification> createNotification(Map<String, dynamic> input);
  Future<void> markNotificationRead(String id);
  Future<void> markAllNotificationsRead();
  Future<void> deleteNotification(String id);

  Future<List<SavedFilter>> listSavedFilters();
  Future<SavedFilter> createSavedFilter(Map<String, dynamic> input);
  Future<void> deleteSavedFilter(String id);

  Future<({String path, String name})> uploadReceipt(String transactionId, ReceiptFile file);
  Future<String?> getReceiptUrl(String path);
  Future<void> deleteReceipt(String path);

  Future<Map<String, dynamic>> exportAll();
  Future<void> importAll(Object payload);
}

typedef VoidAuthListener = void Function();
