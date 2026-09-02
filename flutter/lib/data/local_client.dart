import 'dart:convert';

import 'package:crypto/crypto.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../core/dates.dart';
import '../core/defaults.dart';
import '../core/errors.dart';
import '../core/utils.dart';
import '../models/models.dart';
import 'client.dart';

const dbKey = 'aureum.db.v1';
const sessionKey = 'aureum.session.v1';
const attachPrefix = 'aureum-attachments:';

class _LocalUser {
  _LocalUser({required this.id, required this.email, required this.passwordHash, required this.salt});

  final String id;
  final String email;
  String passwordHash;
  String salt;

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'passwordHash': passwordHash,
        'salt': salt,
      };

  factory _LocalUser.fromJson(Map<String, dynamic> json) {
    return _LocalUser(
      id: json['id'] as String,
      email: json['email'] as String,
      passwordHash: json['passwordHash'] as String,
      salt: json['salt'] as String,
    );
  }
}

class UserStore {
  UserStore({
    required this.profile,
    required this.accounts,
    required this.categories,
    required this.transactions,
    required this.budgets,
    required this.recurring,
    required this.goals,
    required this.notifications,
    required this.savedFilters,
  });

  Profile profile;
  List<Account> accounts;
  List<Category> categories;
  List<Transaction> transactions;
  List<Budget> budgets;
  List<RecurringTransaction> recurring;
  List<Goal> goals;
  List<AppNotification> notifications;
  List<SavedFilter> savedFilters;

  Map<String, dynamic> toJson() => {
        'profile': profile.toJson(),
        'accounts': accounts.map((item) => item.toJson()).toList(),
        'categories': categories.map((item) => item.toJson()).toList(),
        'transactions': transactions.map((item) => item.toJson()).toList(),
        'budgets': budgets.map((item) => item.toJson()).toList(),
        'recurring': recurring.map((item) => item.toJson()).toList(),
        'goals': goals.map((item) => item.toJson()).toList(),
        'notifications': notifications.map((item) => item.toJson()).toList(),
        'savedFilters': savedFilters.map((item) => item.toJson()).toList(),
      };

  factory UserStore.fromJson(Map<String, dynamic> json) {
    List<T> list<T>(String key, T Function(Map<String, dynamic>) parse) {
      return (json[key] as List? ?? []).map((item) => parse(Map<String, dynamic>.from(item as Map))).toList();
    }

    return UserStore(
      profile: Profile.fromJson(Map<String, dynamic>.from(json['profile'] as Map)),
      accounts: list('accounts', Account.fromJson),
      categories: list('categories', Category.fromJson),
      transactions: list('transactions', Transaction.fromJson),
      budgets: list('budgets', Budget.fromJson),
      recurring: list('recurring', RecurringTransaction.fromJson),
      goals: list('goals', Goal.fromJson),
      notifications: list('notifications', AppNotification.fromJson),
      savedFilters: list('savedFilters', SavedFilter.fromJson),
    );
  }
}

class _Database {
  _Database({required this.users, required this.stores});

  List<_LocalUser> users;
  Map<String, UserStore> stores;

  Map<String, dynamic> toJson() => {
        'users': users.map((item) => item.toJson()).toList(),
        'stores': stores.map((key, value) => MapEntry(key, value.toJson())),
      };

  factory _Database.fromJson(Map<String, dynamic> json) {
    final storesRaw = Map<String, dynamic>.from(json['stores'] as Map? ?? {});
    return _Database(
      users: (json['users'] as List? ?? [])
          .map((item) => _LocalUser.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(),
      stores: storesRaw.map((key, value) => MapEntry(key, UserStore.fromJson(Map<String, dynamic>.from(value as Map)))),
    );
  }
}

class LocalDataClient implements DataClient {
  LocalDataClient(this._prefs, {FlutterSecureStorage? secure}) : _secure = secure ?? const FlutterSecureStorage();

  final SharedPreferences _prefs;
  final FlutterSecureStorage _secure;
  final _listeners = <void Function(Session? session)>{};
  String? _cachedUserId;

  @override
  String get backend => 'local';

  _Database _loadDb() {
    final raw = _prefs.getString(dbKey);
    if (raw == null) return _Database(users: [], stores: {});
    try {
      return _Database.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      return _Database(users: [], stores: {});
    }
  }

  Future<void> _saveDb(_Database db) async {
    await _prefs.setString(dbKey, jsonEncode(db.toJson()));
  }

  String _hashPassword(String password, String salt) {
    return sha256.convert(utf8.encode('$salt:$password')).toString();
  }

  UserStore _emptyStore(String userId, String email, String fullName) {
    final now = DateTime.now().toIso8601String();
    final categories = [
      for (var index = 0; index < defaultCategories.length; index++)
        Category(
          id: createId(),
          userId: userId,
          name: defaultCategories[index].name,
          kind: defaultCategories[index].kind,
          icon: defaultCategories[index].icon,
          color: defaultCategories[index].color,
          parentId: null,
          sortOrder: index,
          isSystem: true,
          createdAt: now,
          updatedAt: now,
        ),
    ];
    return UserStore(
      profile: Profile(
        id: userId,
        email: email,
        fullName: fullName,
        avatarUrl: null,
        currency: 'USD',
        dateFormat: 'MMM d, yyyy',
        theme: ThemePreference.system,
        onboardingCompleted: false,
        notificationPreferences: defaultNotificationPreferences,
        createdAt: now,
        updatedAt: now,
      ),
      accounts: [],
      categories: categories,
      transactions: [],
      budgets: [],
      recurring: [],
      goals: [],
      notifications: [],
      savedFilters: [],
    );
  }

  String _requireUserId() {
    if (_cachedUserId != null) return _cachedUserId!;
    throw const AppError('Your session expired. Please sign in again.', 'unauthenticated');
  }

  Future<void> _persistSession(Session session) async {
    _cachedUserId = session.user.id;
    await _secure.write(key: sessionKey, value: jsonEncode(session.toJson()));
    await _prefs.remove(sessionKey);
  }

  Future<String?> _readSessionRaw() async {
    return await _secure.read(key: sessionKey) ?? _prefs.getString(sessionKey);
  }

  Future<T> _withStore<T>(T Function(UserStore store) mutate) async {
    final userId = _requireUserId();
    final db = _loadDb();
    final store = db.stores[userId];
    if (store == null) throw const AppError('Account data was not found.', 'not_found');
    final result = mutate(store);
    await _saveDb(db);
    return result;
  }

  void _emit(Session? session) {
    for (final listener in _listeners) {
      listener(session);
    }
  }

  Session _sessionFromProfile(Profile profile) => Session(user: profile, accessToken: 'local.${profile.id}');

  void _generateDueRecurring(UserStore store) {
    final today = toISODate(DateTime.now());
    for (final rule in store.recurring) {
      if (!rule.active) continue;
      var guard = 0;
      while (rule.nextOccurrence.compareTo(today) <= 0 && guard < 36) {
        final exists = store.transactions.any((tx) => tx.recurringId == rule.id && tx.date == rule.nextOccurrence);
        if (!exists) {
          final now = DateTime.now().toIso8601String();
          store.transactions.insert(
            0,
            Transaction(
              id: createId(),
              userId: rule.userId,
              type: rule.type,
              amount: rule.amount,
              currency: rule.currency,
              categoryId: rule.categoryId,
              subcategoryId: null,
              accountId: rule.accountId,
              toAccountId: null,
              merchant: rule.merchant,
              description: 'Generated from recurring',
              notes: rule.notes,
              date: rule.nextOccurrence,
              paymentMethod: rule.paymentMethod,
              tags: const ['recurring'],
              recurringId: rule.id,
              attachmentPath: null,
              attachmentName: null,
              isSample: false,
              createdAt: now,
              updatedAt: now,
            ),
          );
        }
        final next = nextOccurrence(DateTime.parse(rule.nextOccurrence), rule.frequency, rule.interval);
        rule.nextOccurrence = toISODate(next);
        if (rule.endDate != null && rule.nextOccurrence.compareTo(rule.endDate!) > 0) {
          rule.active = false;
          break;
        }
        guard += 1;
      }
    }
  }

  Map<String, dynamic> _applyPatch(Map<String, dynamic> current, Map<String, dynamic> patch) {
    return {...current, ...patch, 'updatedAt': DateTime.now().toIso8601String()};
  }

  @override
  Future<Session?> getSession() async {
    final raw = await _readSessionRaw();
    if (raw == null) return null;
    final session = Session.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    final db = _loadDb();
    final store = db.stores[session.user.id];
    if (store == null) {
      _cachedUserId = null;
      await _secure.delete(key: sessionKey);
      await _prefs.remove(sessionKey);
      return null;
    }
    _cachedUserId = store.profile.id;
    _generateDueRecurring(store);
    await _saveDb(db);
    return _sessionFromProfile(store.profile);
  }

  @override
  VoidAuthListener onAuthChange(void Function(Session? session) listener) {
    _listeners.add(listener);
    return () => _listeners.remove(listener);
  }

  @override
  Future<Session> signUp(String email, String password, String fullName) async {
    final db = _loadDb();
    if (db.users.any((user) => user.email.toLowerCase() == email.toLowerCase())) {
      throw const AppError('An account with this email already exists.', 'exists');
    }
    final id = createId();
    final salt = createId();
    db.users.add(
      _LocalUser(id: id, email: email.toLowerCase(), passwordHash: _hashPassword(password, salt), salt: salt),
    );
    db.stores[id] = _emptyStore(id, email.toLowerCase(), fullName);
    await _saveDb(db);
    final session = _sessionFromProfile(db.stores[id]!.profile);
    await _persistSession(session);
    _emit(session);
    return session;
  }

  @override
  Future<Session> signIn(String email, String password) async {
    final db = _loadDb();
    final user = db.users.cast<_LocalUser?>().firstWhere(
          (item) => item!.email == email.toLowerCase(),
          orElse: () => null,
        );
    if (user == null) throw const AppError('Email or password is incorrect.', 'invalid_credentials');
    if (_hashPassword(password, user.salt) != user.passwordHash) {
      throw const AppError('Email or password is incorrect.', 'invalid_credentials');
    }
    final store = db.stores[user.id]!;
    _generateDueRecurring(store);
    await _saveDb(db);
    final session = _sessionFromProfile(store.profile);
    await _persistSession(session);
    _emit(session);
    return session;
  }

  @override
  Future<void> signInWithGoogle() async {
    throw const AppError(
      'Google sign-in requires Supabase Auth. Add your project credentials to enable it.',
      'unsupported',
    );
  }

  @override
  Future<void> signOut() async {
    _cachedUserId = null;
    await _secure.delete(key: sessionKey);
    await _prefs.remove(sessionKey);
    _emit(null);
  }

  @override
  Future<void> requestPasswordReset(String email) async {
    final db = _loadDb();
    if (!db.users.any((user) => user.email == email.toLowerCase())) return;
  }

  @override
  Future<void> updatePassword(String password) async {
    final userId = _requireUserId();
    final db = _loadDb();
    final user = db.users.cast<_LocalUser?>().firstWhere((item) => item!.id == userId, orElse: () => null);
    if (user == null) throw const AppError('Account was not found.', 'not_found');
    user.salt = createId();
    user.passwordHash = _hashPassword(password, user.salt);
    await _saveDb(db);
  }

  @override
  Future<Profile> updateProfile(Map<String, dynamic> patch) {
    return _withStore((store) {
      store.profile = Profile.fromJson(_applyPatch(store.profile.toJson(), patch));
      final session = _sessionFromProfile(store.profile);
      _persistSession(session);
      _emit(session);
      return store.profile;
    });
  }

  @override
  Future<String> uploadAvatar(ReceiptFile file) async {
    if (file.size > receiptMaxBytes) throw const AppError('Avatar must be under 8MB.', 'file_too_large');
    final dataUrl = 'data:${file.mimeType};base64,${base64Encode(file.bytes)}';
    await updateProfile({'avatarUrl': dataUrl});
    return dataUrl;
  }

  @override
  Future<void> deleteAccount() async {
    final userId = _requireUserId();
    final db = _loadDb();
    db.users = db.users.where((user) => user.id != userId).toList();
    db.stores.remove(userId);
    await _saveDb(db);
    _cachedUserId = null;
    await _secure.delete(key: sessionKey);
    await _prefs.remove(sessionKey);
    _emit(null);
  }

  @override
  Future<List<Account>> listAccounts() => _withStore((store) => [...store.accounts]);

  @override
  Future<Account> createAccount(Map<String, dynamic> input) {
    return _withStore((store) {
      final now = DateTime.now().toIso8601String();
      final record = Account.fromJson({
        ...input,
        'id': createId(),
        'userId': store.profile.id,
        'createdAt': now,
        'updatedAt': now,
      });
      store.accounts.add(record);
      return record;
    });
  }

  @override
  Future<Account> updateAccount(String id, Map<String, dynamic> patch) {
    return _withStore((store) {
      final index = store.accounts.indexWhere((item) => item.id == id);
      if (index < 0) throw const AppError('Account not found.', 'not_found');
      final next = Account.fromJson(_applyPatch(store.accounts[index].toJson(), patch));
      store.accounts[index] = next;
      return next;
    });
  }

  @override
  Future<void> deleteAccountRecord(String id) {
    return _withStore((store) {
      if (store.transactions.any((tx) => tx.accountId == id || tx.toAccountId == id)) {
        throw const AppError('This account has transactions. Archive it or move them first.', 'in_use');
      }
      store.accounts = store.accounts.where((item) => item.id != id).toList();
    });
  }

  @override
  Future<List<Category>> listCategories() {
    return _withStore((store) {
      final copy = [...store.categories]..sort((a, b) => a.sortOrder.compareTo(b.sortOrder));
      return copy;
    });
  }

  @override
  Future<Category> createCategory(Map<String, dynamic> input) {
    return _withStore((store) {
      final now = DateTime.now().toIso8601String();
      final record = Category.fromJson({
        ...input,
        'id': createId(),
        'userId': store.profile.id,
        'createdAt': now,
        'updatedAt': now,
      });
      store.categories.add(record);
      return record;
    });
  }

  @override
  Future<Category> updateCategory(String id, Map<String, dynamic> patch) {
    return _withStore((store) {
      final index = store.categories.indexWhere((item) => item.id == id);
      if (index < 0) throw const AppError('Category not found.', 'not_found');
      final next = Category.fromJson(_applyPatch(store.categories[index].toJson(), patch));
      store.categories[index] = next;
      return next;
    });
  }

  @override
  Future<void> deleteCategory(String id) {
    return _withStore((store) {
      if (store.transactions.any((tx) => tx.categoryId == id || tx.subcategoryId == id)) {
        throw const AppError('This category is used by transactions and cannot be deleted.', 'in_use');
      }
      if (store.categories.any((item) => item.parentId == id)) {
        throw const AppError('Remove subcategories before deleting this category.', 'in_use');
      }
      store.categories = store.categories.where((item) => item.id != id).toList();
    });
  }

  @override
  Future<void> reorderCategories(List<String> ids) {
    return _withStore((store) {
      for (var index = 0; index < ids.length; index++) {
        final recordIndex = store.categories.indexWhere((item) => item.id == ids[index]);
        if (recordIndex >= 0) {
          store.categories[recordIndex] = store.categories[recordIndex].copyWith(sortOrder: index);
        }
      }
    });
  }

  @override
  Future<List<Transaction>> listTransactions() {
    return _withStore((store) {
      _generateDueRecurring(store);
      return [...store.transactions];
    });
  }

  @override
  Future<Transaction> createTransaction(CreateTransactionInput input) {
    return _withStore((store) {
      final now = DateTime.now().toIso8601String();
      final record = Transaction.fromJson({
        ...input.toJson(),
        'id': createId(),
        'userId': store.profile.id,
        'createdAt': now,
        'updatedAt': now,
      });
      store.transactions.insert(0, record);
      return record;
    });
  }

  @override
  Future<Transaction> updateTransaction(String id, Map<String, dynamic> patch) {
    return _withStore((store) {
      final index = store.transactions.indexWhere((item) => item.id == id);
      if (index < 0) throw const AppError('Transaction not found.', 'not_found');
      final next = Transaction.fromJson(_applyPatch(store.transactions[index].toJson(), patch));
      store.transactions[index] = next;
      return next;
    });
  }

  @override
  Future<void> deleteTransaction(String id) {
    return _withStore((store) {
      store.transactions = store.transactions.where((item) => item.id != id).toList();
    });
  }

  @override
  Future<void> deleteTransactions(List<String> ids) {
    return _withStore((store) {
      store.transactions = store.transactions.where((item) => !ids.contains(item.id)).toList();
    });
  }

  @override
  Future<void> updateTransactions(List<String> ids, Map<String, dynamic> patch) {
    return _withStore((store) {
      final now = DateTime.now().toIso8601String();
      store.transactions = [
        for (final item in store.transactions)
          if (ids.contains(item.id)) Transaction.fromJson({...item.toJson(), ...patch, 'updatedAt': now}) else item,
      ];
    });
  }

  @override
  Future<List<Budget>> listBudgets() => _withStore((store) => [...store.budgets]);

  @override
  Future<Budget> createBudget(Map<String, dynamic> input) {
    return _withStore((store) {
      final now = DateTime.now().toIso8601String();
      final record = Budget.fromJson({
        ...input,
        'id': createId(),
        'userId': store.profile.id,
        'createdAt': now,
        'updatedAt': now,
      });
      store.budgets.add(record);
      return record;
    });
  }

  @override
  Future<Budget> updateBudget(String id, Map<String, dynamic> patch) {
    return _withStore((store) {
      final index = store.budgets.indexWhere((item) => item.id == id);
      if (index < 0) throw const AppError('Budget not found.', 'not_found');
      final next = Budget.fromJson(_applyPatch(store.budgets[index].toJson(), patch));
      store.budgets[index] = next;
      return next;
    });
  }

  @override
  Future<void> deleteBudget(String id) {
    return _withStore((store) {
      store.budgets = store.budgets.where((item) => item.id != id).toList();
    });
  }

  @override
  Future<List<RecurringTransaction>> listRecurring() => _withStore((store) => [...store.recurring]);

  @override
  Future<RecurringTransaction> createRecurring(Map<String, dynamic> input) {
    return _withStore((store) {
      final now = DateTime.now().toIso8601String();
      final record = RecurringTransaction.fromJson({
        ...input,
        'id': createId(),
        'userId': store.profile.id,
        'createdAt': now,
        'updatedAt': now,
      });
      store.recurring.add(record);
      _generateDueRecurring(store);
      return record;
    });
  }

  @override
  Future<RecurringTransaction> updateRecurring(String id, Map<String, dynamic> patch) {
    return _withStore((store) {
      final index = store.recurring.indexWhere((item) => item.id == id);
      if (index < 0) throw const AppError('Recurring transaction not found.', 'not_found');
      final next = RecurringTransaction.fromJson(_applyPatch(store.recurring[index].toJson(), patch));
      store.recurring[index] = next;
      return next;
    });
  }

  @override
  Future<void> deleteRecurring(String id) {
    return _withStore((store) {
      store.recurring = store.recurring.where((item) => item.id != id).toList();
    });
  }

  @override
  Future<List<Goal>> listGoals() => _withStore((store) => [...store.goals]);

  @override
  Future<Goal> createGoal(Map<String, dynamic> input) {
    return _withStore((store) {
      final now = DateTime.now().toIso8601String();
      final record = Goal.fromJson({
        ...input,
        'id': createId(),
        'userId': store.profile.id,
        'createdAt': now,
        'updatedAt': now,
      });
      store.goals.add(record);
      return record;
    });
  }

  @override
  Future<Goal> updateGoal(String id, Map<String, dynamic> patch) {
    return _withStore((store) {
      final index = store.goals.indexWhere((item) => item.id == id);
      if (index < 0) throw const AppError('Goal not found.', 'not_found');
      final next = Goal.fromJson(_applyPatch(store.goals[index].toJson(), patch));
      store.goals[index] = next;
      return next;
    });
  }

  @override
  Future<void> deleteGoal(String id) {
    return _withStore((store) {
      store.goals = store.goals.where((item) => item.id != id).toList();
    });
  }

  @override
  Future<List<AppNotification>> listNotifications() => _withStore((store) => [...store.notifications]);

  @override
  Future<AppNotification> createNotification(Map<String, dynamic> input) {
    return _withStore((store) {
      final record = AppNotification.fromJson({
        ...input,
        'id': createId(),
        'userId': store.profile.id,
        'createdAt': DateTime.now().toIso8601String(),
      });
      store.notifications.insert(0, record);
      return record;
    });
  }

  @override
  Future<void> markNotificationRead(String id) {
    return _withStore((store) {
      store.notifications = [
        for (final item in store.notifications) if (item.id == id) item.copyWith(read: true) else item,
      ];
    });
  }

  @override
  Future<void> markAllNotificationsRead() {
    return _withStore((store) {
      store.notifications = [for (final item in store.notifications) item.copyWith(read: true)];
    });
  }

  @override
  Future<void> deleteNotification(String id) {
    return _withStore((store) {
      store.notifications = store.notifications.where((item) => item.id != id).toList();
    });
  }

  @override
  Future<List<SavedFilter>> listSavedFilters() => _withStore((store) => [...store.savedFilters]);

  @override
  Future<SavedFilter> createSavedFilter(Map<String, dynamic> input) {
    return _withStore((store) {
      final record = SavedFilter.fromJson({
        ...input,
        'id': createId(),
        'userId': store.profile.id,
        'createdAt': DateTime.now().toIso8601String(),
      });
      store.savedFilters.add(record);
      return record;
    });
  }

  @override
  Future<void> deleteSavedFilter(String id) {
    return _withStore((store) {
      store.savedFilters = store.savedFilters.where((item) => item.id != id).toList();
    });
  }

  @override
  Future<({String path, String name})> uploadReceipt(String transactionId, ReceiptFile file) async {
    if (file.size > receiptMaxBytes) throw const AppError('Receipts must be under 8MB.', 'file_too_large');
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.contains(file.mimeType)) {
      throw const AppError('Only JPG, PNG, WebP, or PDF receipts are allowed.', 'invalid_type');
    }
    final userId = _requireUserId();
    final path = '$userId/$transactionId/${file.name}';
    final dataUrl = 'data:${file.mimeType};base64,${base64Encode(file.bytes)}';
    await _prefs.setString('$attachPrefix$path', dataUrl);
    await updateTransaction(transactionId, {'attachmentPath': path, 'attachmentName': file.name});
    return (path: path, name: file.name);
  }

  @override
  Future<String?> getReceiptUrl(String path) async => _prefs.getString('$attachPrefix$path');

  @override
  Future<void> deleteReceipt(String path) async {
    await _prefs.remove('$attachPrefix$path');
  }

  @override
  Future<Map<String, dynamic>> exportAll() {
    return _withStore((store) => jsonDecode(jsonEncode(store.toJson())) as Map<String, dynamic>);
  }

  @override
  Future<void> importAll(Object payload) {
    return _withStore((store) {
      final data = Map<String, dynamic>.from(payload as Map);
      if (data['accounts'] != null) {
        store.accounts =
            (data['accounts'] as List).map((item) => Account.fromJson(Map<String, dynamic>.from(item as Map))).toList();
      }
      if (data['categories'] != null) {
        store.categories = (data['categories'] as List)
            .map((item) => Category.fromJson(Map<String, dynamic>.from(item as Map)))
            .toList();
      }
      if (data['transactions'] != null) {
        store.transactions = (data['transactions'] as List)
            .map((item) => Transaction.fromJson(Map<String, dynamic>.from(item as Map)))
            .toList();
      }
      if (data['budgets'] != null) {
        store.budgets =
            (data['budgets'] as List).map((item) => Budget.fromJson(Map<String, dynamic>.from(item as Map))).toList();
      }
      if (data['recurring'] != null) {
        store.recurring = (data['recurring'] as List)
            .map((item) => RecurringTransaction.fromJson(Map<String, dynamic>.from(item as Map)))
            .toList();
      }
      if (data['goals'] != null) {
        store.goals =
            (data['goals'] as List).map((item) => Goal.fromJson(Map<String, dynamic>.from(item as Map))).toList();
      }
    });
  }
}
