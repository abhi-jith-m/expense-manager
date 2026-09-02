import 'dart:async';

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:supabase_flutter/supabase_flutter.dart' hide Session;

import '../core/dates.dart';
import '../core/env.dart';
import '../core/errors.dart';
import '../core/utils.dart';
import '../models/models.dart';
import 'client.dart';
import 'mappers.dart';

class SupabaseDataClient implements DataClient {
  SupabaseDataClient(this._supabase);

  final SupabaseClient _supabase;

  @override
  String get backend => 'supabase';

  Future<T> _guard<T>(Future<T> Function() run, [String fallback = 'Request failed.']) async {
    try {
      return await run();
    } on AppError {
      rethrow;
    } on AuthException catch (error) {
      throw AppError(error.message);
    } on PostgrestException catch (error) {
      throw AppError(error.message.isEmpty ? fallback : error.message);
    } on StorageException catch (error) {
      throw AppError(error.message);
    } catch (_) {
      throw AppError(fallback);
    }
  }

  Future<String> _userId() async {
    final user = _supabase.auth.currentUser ?? (await _supabase.auth.getUser()).user;
    if (user == null) {
      throw const AppError('Your session expired. Please sign in again.', 'unauthenticated');
    }
    return user.id;
  }

  Future<Session?> _loadSession({bool processDue = true}) async {
    final authSession = _supabase.auth.currentSession;
    if (authSession == null) return null;
    try {
      final row = await _supabase.from('profiles').select().eq('id', authSession.user.id).maybeSingle();
      if (row == null) return null;
      final session = Session(
        accessToken: authSession.accessToken,
        user: mapProfile(Map<String, dynamic>.from(row), authSession.user.email ?? ''),
      );
      if (processDue) await _processRecurring(session.user.id);
      return session;
    } catch (_) {
      return null;
    }
  }

  Future<void> _processRecurring(String userId) async {
    final rows = await _supabase.from('recurring_transactions').select().eq('user_id', userId).eq('active', true);
    if (rows.isEmpty) return;
    final today = toISODate(DateTime.now());
    for (final raw in rows) {
      final rule = mapRecurring(Map<String, dynamic>.from(raw as Map));
      var next = rule.nextOccurrence;
      var active = rule.active;
      var guard = 0;
      while (next.compareTo(today) <= 0 && active && guard < 36) {
        final existing = await _supabase
            .from('transactions')
            .select('id')
            .eq('recurring_id', rule.id)
            .eq('date', next)
            .maybeSingle();
        if (existing == null) {
          await _supabase.from('transactions').insert(
                transactionToRow(
                  {
                    'type': rule.type.value,
                    'amount': rule.amount,
                    'currency': rule.currency,
                    'categoryId': rule.categoryId,
                    'subcategoryId': null,
                    'accountId': rule.accountId,
                    'toAccountId': null,
                    'merchant': rule.merchant,
                    'description': 'Generated from recurring',
                    'notes': rule.notes,
                    'date': next,
                    'paymentMethod': rule.paymentMethod.value,
                    'tags': ['recurring'],
                    'recurringId': rule.id,
                    'attachmentPath': null,
                    'attachmentName': null,
                    'isSample': false,
                  },
                  userId,
                ),
              );
        }
        next = toISODate(nextOccurrence(DateTime.parse(next), rule.frequency, rule.interval));
        if (rule.endDate != null && next.compareTo(rule.endDate!) > 0) active = false;
        guard += 1;
      }
      await _supabase.from('recurring_transactions').update({'next_occurrence': next, 'active': active}).eq('id', rule.id);
    }
  }

  @override
  Future<Session?> getSession() => _guard(() async {
        final session = await _loadSession();
        return session;
      }, 'Could not load your session.');

  @override
  VoidAuthListener onAuthChange(void Function(Session? session) listener) {
    final subscription = _supabase.auth.onAuthStateChange.listen((data) async {
      final processDue = data.event != AuthChangeEvent.tokenRefreshed;
      listener(await _loadSession(processDue: processDue));
    });
    return subscription.cancel;
  }

  @override
  Future<Session> signUp(String email, String password, String fullName) {
    return _guard(() async {
      final result = await _supabase.auth.signUp(
        email: email,
        password: password,
        data: {'full_name': fullName},
      );
      if (result.session == null) {
        throw const AppError('Check your email to verify your account before signing in.', 'verify_email');
      }
      final session = await _loadSession();
      if (session == null) throw const AppError('Could not create a session. Try signing in.');
      return session;
    }, 'Could not create a session. Try signing in.');
  }

  @override
  Future<Session> signIn(String email, String password) {
    return _guard(() async {
      await _supabase.auth.signInWithPassword(email: email, password: password);
      final session = await _loadSession();
      if (session == null) throw const AppError('Could not load your profile.');
      return session;
    }, 'Could not load your profile.');
  }

  @override
  Future<void> signInWithGoogle() {
    return _guard(() async {
      await _supabase.auth.signInWithOAuth(
        OAuthProvider.google,
        redirectTo: kIsWeb ? '${Uri.base.origin}/' : AppEnv.authRedirect,
        authScreenLaunchMode: kIsWeb ? LaunchMode.platformDefault : LaunchMode.externalApplication,
      );
    }, 'Google sign-in failed.');
  }

  @override
  Future<void> signOut() => _guard(() => _supabase.auth.signOut(), 'Could not sign out.');

  @override
  Future<void> requestPasswordReset(String email) {
    return _guard(() async {
      await _supabase.auth.resetPasswordForEmail(
        email,
        redirectTo: kIsWeb ? '${Uri.base.origin}/reset-password' : AppEnv.authRedirect,
      );
    }, 'Could not send a reset link.');
  }

  @override
  Future<void> updatePassword(String password) {
    return _guard(() => _supabase.auth.updateUser(UserAttributes(password: password)), 'Could not update password.');
  }

  @override
  Future<Profile> updateProfile(Map<String, dynamic> patch) {
    return _guard(() async {
      final userId = await _userId();
      final row = camelPatchToRow(patch);
      row['updated_at'] = DateTime.now().toIso8601String();
      final data = await _supabase.from('profiles').update(row).eq('id', userId).select().single();
      final email = _supabase.auth.currentUser?.email ?? '';
      return mapProfile(Map<String, dynamic>.from(data), email);
    }, 'Could not update profile.');
  }

  @override
  Future<String> uploadAvatar(ReceiptFile file) {
    return _guard(() async {
      if (file.size > receiptMaxBytes) throw const AppError('Avatar must be under 8MB.', 'file_too_large');
      final userId = await _userId();
      final path = '$userId/avatar-${DateTime.now().millisecondsSinceEpoch}-${file.name}';
      await _supabase.storage.from('avatars').uploadBinary(
            path,
            file.bytes,
            fileOptions: FileOptions(contentType: file.mimeType, upsert: true),
          );
      final url = _supabase.storage.from('avatars').getPublicUrl(path);
      await updateProfile({'avatarUrl': url});
      return url;
    }, 'Could not upload avatar.');
  }

  @override
  Future<void> deleteAccount() {
    return _guard(() async {
      final userId = await _userId();
      try {
        await _supabase.rpc('delete_own_account');
      } catch (_) {
        await _supabase.from('profiles').delete().eq('id', userId);
      }
      await _supabase.auth.signOut();
    }, 'Could not delete account.');
  }

  @override
  Future<List<Account>> listAccounts() {
    return _guard(() async {
      final rows = await _supabase.from('accounts').select().order('created_at');
      return [for (final row in rows) mapAccount(Map<String, dynamic>.from(row as Map))];
    }, 'Could not load accounts.');
  }

  @override
  Future<Account> createAccount(Map<String, dynamic> input) {
    return _guard(() async {
      final data = await _supabase.from('accounts').insert(camelPatchToRow(input, userId: await _userId())).select().single();
      return mapAccount(Map<String, dynamic>.from(data));
    }, 'Could not create account.');
  }

  @override
  Future<Account> updateAccount(String id, Map<String, dynamic> patch) {
    return _guard(() async {
      final row = camelPatchToRow(patch)..['updated_at'] = DateTime.now().toIso8601String();
      final data = await _supabase.from('accounts').update(row).eq('id', id).select().single();
      return mapAccount(Map<String, dynamic>.from(data));
    }, 'Could not update account.');
  }

  @override
  Future<void> deleteAccountRecord(String id) {
    return _guard(() async {
      final existing = await _supabase.from('transactions').select('id').or('account_id.eq.$id,to_account_id.eq.$id').limit(1);
      if (existing.isNotEmpty) {
        throw const AppError('This account has transactions. Archive it or move them first.', 'in_use');
      }
      await _supabase.from('accounts').delete().eq('id', id);
    }, 'Could not delete account.');
  }

  @override
  Future<List<Category>> listCategories() {
    return _guard(() async {
      final rows = await _supabase.from('categories').select().order('sort_order');
      return [for (final row in rows) mapCategory(Map<String, dynamic>.from(row as Map))];
    }, 'Could not load categories.');
  }

  @override
  Future<Category> createCategory(Map<String, dynamic> input) {
    return _guard(() async {
      final data = await _supabase.from('categories').insert(camelPatchToRow(input, userId: await _userId())).select().single();
      return mapCategory(Map<String, dynamic>.from(data));
    }, 'Could not create category.');
  }

  @override
  Future<Category> updateCategory(String id, Map<String, dynamic> patch) {
    return _guard(() async {
      final row = camelPatchToRow(patch)..['updated_at'] = DateTime.now().toIso8601String();
      final data = await _supabase.from('categories').update(row).eq('id', id).select().single();
      return mapCategory(Map<String, dynamic>.from(data));
    }, 'Could not update category.');
  }

  @override
  Future<void> deleteCategory(String id) {
    return _guard(() async {
      final existing =
          await _supabase.from('transactions').select('id').or('category_id.eq.$id,subcategory_id.eq.$id').limit(1);
      if (existing.isNotEmpty) {
        throw const AppError('This category is used by transactions and cannot be deleted.', 'in_use');
      }
      await _supabase.from('categories').delete().eq('id', id);
    }, 'Could not delete category.');
  }

  @override
  Future<void> reorderCategories(List<String> ids) {
    return _guard(() async {
      await Future.wait([
        for (var index = 0; index < ids.length; index++)
          _supabase.from('categories').update({'sort_order': index}).eq('id', ids[index]),
      ]);
    }, 'Could not reorder categories.');
  }

  @override
  Future<List<Transaction>> listTransactions() {
    return _guard(() async {
      await _processRecurring(await _userId());
      final rows = await _supabase.from('transactions').select().order('date', ascending: false);
      return [for (final row in rows) mapTransaction(Map<String, dynamic>.from(row as Map))];
    }, 'Could not load transactions.');
  }

  @override
  Future<Transaction> createTransaction(CreateTransactionInput input) {
    return _guard(() async {
      final data =
          await _supabase.from('transactions').insert(transactionToRow(input.toJson(), await _userId())).select().single();
      return mapTransaction(Map<String, dynamic>.from(data));
    }, 'Could not create transaction.');
  }

  @override
  Future<Transaction> updateTransaction(String id, Map<String, dynamic> patch) {
    return _guard(() async {
      final row = transactionToRow(patch)..['updated_at'] = DateTime.now().toIso8601String();
      final data = await _supabase.from('transactions').update(row).eq('id', id).select().single();
      return mapTransaction(Map<String, dynamic>.from(data));
    }, 'Could not update transaction.');
  }

  @override
  Future<void> deleteTransaction(String id) {
    return _guard(() => _supabase.from('transactions').delete().eq('id', id), 'Could not delete transaction.');
  }

  @override
  Future<void> deleteTransactions(List<String> ids) {
    return _guard(() => _supabase.from('transactions').delete().inFilter('id', ids), 'Could not delete transactions.');
  }

  @override
  Future<void> updateTransactions(List<String> ids, Map<String, dynamic> patch) {
    return _guard(() async {
      final row = transactionToRow(patch)..['updated_at'] = DateTime.now().toIso8601String();
      await _supabase.from('transactions').update(row).inFilter('id', ids);
    }, 'Could not update transactions.');
  }

  @override
  Future<List<Budget>> listBudgets() {
    return _guard(() async {
      final rows = await _supabase.from('budgets').select().order('created_at');
      return [for (final row in rows) mapBudget(Map<String, dynamic>.from(row as Map))];
    }, 'Could not load budgets.');
  }

  @override
  Future<Budget> createBudget(Map<String, dynamic> input) {
    return _guard(() async {
      final data = await _supabase.from('budgets').insert(camelPatchToRow(input, userId: await _userId())).select().single();
      return mapBudget(Map<String, dynamic>.from(data));
    }, 'Could not create budget.');
  }

  @override
  Future<Budget> updateBudget(String id, Map<String, dynamic> patch) {
    return _guard(() async {
      final row = camelPatchToRow(patch)..['updated_at'] = DateTime.now().toIso8601String();
      final data = await _supabase.from('budgets').update(row).eq('id', id).select().single();
      return mapBudget(Map<String, dynamic>.from(data));
    }, 'Could not update budget.');
  }

  @override
  Future<void> deleteBudget(String id) {
    return _guard(() => _supabase.from('budgets').delete().eq('id', id), 'Could not delete budget.');
  }

  @override
  Future<List<RecurringTransaction>> listRecurring() {
    return _guard(() async {
      final rows = await _supabase.from('recurring_transactions').select().order('next_occurrence');
      return [for (final row in rows) mapRecurring(Map<String, dynamic>.from(row as Map))];
    }, 'Could not load recurring transactions.');
  }

  @override
  Future<RecurringTransaction> createRecurring(Map<String, dynamic> input) {
    return _guard(() async {
      final userId = await _userId();
      final data = await _supabase.from('recurring_transactions').insert(camelPatchToRow(input, userId: userId)).select().single();
      await _processRecurring(userId);
      return mapRecurring(Map<String, dynamic>.from(data));
    }, 'Could not create recurring transaction.');
  }

  @override
  Future<RecurringTransaction> updateRecurring(String id, Map<String, dynamic> patch) {
    return _guard(() async {
      final row = camelPatchToRow(patch)..['updated_at'] = DateTime.now().toIso8601String();
      final data = await _supabase.from('recurring_transactions').update(row).eq('id', id).select().single();
      return mapRecurring(Map<String, dynamic>.from(data));
    }, 'Could not update recurring transaction.');
  }

  @override
  Future<void> deleteRecurring(String id) {
    return _guard(() => _supabase.from('recurring_transactions').delete().eq('id', id), 'Could not delete recurring transaction.');
  }

  @override
  Future<List<Goal>> listGoals() {
    return _guard(() async {
      final rows = await _supabase.from('goals').select().order('created_at');
      return [for (final row in rows) mapGoal(Map<String, dynamic>.from(row as Map))];
    }, 'Could not load goals.');
  }

  @override
  Future<Goal> createGoal(Map<String, dynamic> input) {
    return _guard(() async {
      final data = await _supabase.from('goals').insert(camelPatchToRow(input, userId: await _userId())).select().single();
      return mapGoal(Map<String, dynamic>.from(data));
    }, 'Could not create goal.');
  }

  @override
  Future<Goal> updateGoal(String id, Map<String, dynamic> patch) {
    return _guard(() async {
      final row = camelPatchToRow(patch)..['updated_at'] = DateTime.now().toIso8601String();
      final data = await _supabase.from('goals').update(row).eq('id', id).select().single();
      return mapGoal(Map<String, dynamic>.from(data));
    }, 'Could not update goal.');
  }

  @override
  Future<void> deleteGoal(String id) {
    return _guard(() => _supabase.from('goals').delete().eq('id', id), 'Could not delete goal.');
  }

  @override
  Future<List<AppNotification>> listNotifications() {
    return _guard(() async {
      final rows = await _supabase.from('notifications').select().order('created_at', ascending: false);
      return [for (final row in rows) mapNotification(Map<String, dynamic>.from(row as Map))];
    }, 'Could not load notifications.');
  }

  @override
  Future<AppNotification> createNotification(Map<String, dynamic> input) {
    return _guard(() async {
      final data =
          await _supabase.from('notifications').insert(camelPatchToRow(input, userId: await _userId())).select().single();
      return mapNotification(Map<String, dynamic>.from(data));
    }, 'Could not create notification.');
  }

  @override
  Future<void> markNotificationRead(String id) {
    return _guard(() => _supabase.from('notifications').update({'read': true}).eq('id', id), 'Could not update notification.');
  }

  @override
  Future<void> markAllNotificationsRead() {
    return _guard(() async {
      await _supabase.from('notifications').update({'read': true}).eq('user_id', await _userId());
    }, 'Could not update notifications.');
  }

  @override
  Future<void> deleteNotification(String id) {
    return _guard(() => _supabase.from('notifications').delete().eq('id', id), 'Could not delete notification.');
  }

  @override
  Future<List<SavedFilter>> listSavedFilters() {
    return _guard(() async {
      final rows = await _supabase.from('saved_filters').select().order('created_at');
      return [for (final row in rows) mapSavedFilter(Map<String, dynamic>.from(row as Map))];
    }, 'Could not load saved filters.');
  }

  @override
  Future<SavedFilter> createSavedFilter(Map<String, dynamic> input) {
    return _guard(() async {
      final data =
          await _supabase.from('saved_filters').insert(camelPatchToRow(input, userId: await _userId())).select().single();
      return mapSavedFilter(Map<String, dynamic>.from(data));
    }, 'Could not save filter.');
  }

  @override
  Future<void> deleteSavedFilter(String id) {
    return _guard(() => _supabase.from('saved_filters').delete().eq('id', id), 'Could not delete filter.');
  }

  @override
  Future<({String path, String name})> uploadReceipt(String transactionId, ReceiptFile file) {
    return _guard(() async {
      if (file.size > receiptMaxBytes) throw const AppError('Receipts must be under 8MB.', 'file_too_large');
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowed.contains(file.mimeType)) {
        throw const AppError('Only JPG, PNG, WebP, or PDF receipts are allowed.', 'invalid_type');
      }
      final userId = await _userId();
      final path = '$userId/$transactionId/${file.name}';
      await _supabase.storage.from('receipts').uploadBinary(
            path,
            file.bytes,
            fileOptions: FileOptions(contentType: file.mimeType, upsert: true),
          );
      await updateTransaction(transactionId, {'attachmentPath': path, 'attachmentName': file.name});
      return (path: path, name: file.name);
    }, 'Could not upload receipt.');
  }

  @override
  Future<String?> getReceiptUrl(String path) {
    return _guard(() async {
      final result = await _supabase.storage.from('receipts').createSignedUrl(path, 60 * 10);
      return result;
    }, 'Could not load receipt.');
  }

  @override
  Future<void> deleteReceipt(String path) {
    return _guard(() => _supabase.storage.from('receipts').remove([path]), 'Could not delete receipt.');
  }

  @override
  Future<Map<String, dynamic>> exportAll() {
    return _guard(() async {
      final accounts = await listAccounts();
      final categories = await listCategories();
      final transactions = await listTransactions();
      final budgets = await listBudgets();
      final recurring = await listRecurring();
      final goals = await listGoals();
      return {
        'accounts': accounts.map((item) => item.toJson()).toList(),
        'categories': categories.map((item) => item.toJson()).toList(),
        'transactions': transactions.map((item) => item.toJson()).toList(),
        'budgets': budgets.map((item) => item.toJson()).toList(),
        'recurring': recurring.map((item) => item.toJson()).toList(),
        'goals': goals.map((item) => item.toJson()).toList(),
      };
    }, 'Could not export data.');
  }

  @override
  Future<void> importAll(Object payload) async {
    throw const AppError('Bulk workspace import is available from the Import page.');
  }
}
