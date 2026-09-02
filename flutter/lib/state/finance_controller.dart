import 'package:flutter/foundation.dart' hide Category;

import '../data/client.dart';
import '../models/models.dart';

class FinanceController extends ChangeNotifier {
  FinanceController(this.client);

  final DataClient client;
  List<Account> accounts = [];
  List<Category> categories = [];
  List<Transaction> transactions = [];
  List<Budget> budgets = [];
  List<RecurringTransaction> recurring = [];
  List<Goal> goals = [];
  List<AppNotification> notifications = [];
  List<SavedFilter> savedFilters = [];
  bool loading = false;
  Object? error;

  Future<void> refresh() async {
    loading = true;
    error = null;
    notifyListeners();
    try {
      final results = await Future.wait([
        client.listAccounts(),
        client.listCategories(),
        client.listTransactions(),
        client.listBudgets(),
        client.listRecurring(),
        client.listGoals(),
        client.listNotifications(),
        client.listSavedFilters(),
      ]);
      accounts = results[0] as List<Account>;
      categories = results[1] as List<Category>;
      transactions = results[2] as List<Transaction>;
      budgets = results[3] as List<Budget>;
      recurring = results[4] as List<RecurringTransaction>;
      goals = results[5] as List<Goal>;
      notifications = results[6] as List<AppNotification>;
      savedFilters = results[7] as List<SavedFilter>;
    } catch (err) {
      error = err;
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Map<String, Category> get categoryMap => {for (final item in categories) item.id: item};
  Map<String, Account> get accountMap => {for (final item in accounts) item.id: item};
}
