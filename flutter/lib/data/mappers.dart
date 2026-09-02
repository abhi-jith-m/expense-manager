import '../core/defaults.dart';
import '../models/models.dart';

String? _string(Object? value) => value?.toString();

double _number(Object? value) => value is num ? value.toDouble() : double.tryParse('$value') ?? 0;

int _int(Object? value) => value is num ? value.toInt() : int.tryParse('$value') ?? 0;

bool _bool(Object? value) => value == true;

Map<String, dynamic> _map(Object? value) =>
    value is Map ? Map<String, dynamic>.from(value) : <String, dynamic>{};

const camelToSnake = {
  'userId': 'user_id',
  'fullName': 'full_name',
  'avatarUrl': 'avatar_url',
  'dateFormat': 'date_format',
  'onboardingCompleted': 'onboarding_completed',
  'notificationPreferences': 'notification_preferences',
  'openingBalance': 'opening_balance',
  'parentId': 'parent_id',
  'sortOrder': 'sort_order',
  'isSystem': 'is_system',
  'categoryId': 'category_id',
  'subcategoryId': 'subcategory_id',
  'accountId': 'account_id',
  'toAccountId': 'to_account_id',
  'paymentMethod': 'payment_method',
  'recurringId': 'recurring_id',
  'attachmentPath': 'attachment_path',
  'attachmentName': 'attachment_name',
  'isSample': 'is_sample',
  'limitAmount': 'limit_amount',
  'startDate': 'start_date',
  'endDate': 'end_date',
  'alertThreshold': 'alert_threshold',
  'nextOccurrence': 'next_occurrence',
  'targetAmount': 'target_amount',
  'currentAmount': 'current_amount',
  'createdAt': 'created_at',
  'updatedAt': 'updated_at',
};

const _identityKeys = {'id', 'userId', 'createdAt', 'updatedAt', 'email'};

Map<String, dynamic> camelPatchToRow(
  Map<String, dynamic> patch, {
  String? userId,
  bool dropIdentity = true,
}) {
  final row = <String, dynamic>{};
  if (userId != null) row['user_id'] = userId;
  patch.forEach((key, value) {
    if (dropIdentity && _identityKeys.contains(key)) return;
    row[camelToSnake[key] ?? key] = value;
  });
  return row;
}

NotificationPreferences mapNotificationPreferences(Object? raw) {
  final map = _map(raw);
  return NotificationPreferences(
    budgetAlerts: map['budgetAlerts'] as bool? ?? map['budget_alerts'] as bool? ?? defaultNotificationPreferences.budgetAlerts,
    recurringAlerts:
        map['recurringAlerts'] as bool? ?? map['recurring_alerts'] as bool? ?? defaultNotificationPreferences.recurringAlerts,
    goalAlerts: map['goalAlerts'] as bool? ?? map['goal_alerts'] as bool? ?? defaultNotificationPreferences.goalAlerts,
    importExportAlerts: map['importExportAlerts'] as bool? ??
        map['import_export_alerts'] as bool? ??
        defaultNotificationPreferences.importExportAlerts,
  );
}

Profile mapProfile(Map<String, dynamic> row, String email) {
  return Profile(
    id: '${row['id']}',
    email: email,
    fullName: _string(row['full_name']) ?? '',
    avatarUrl: _string(row['avatar_url']),
    currency: _string(row['currency']) ?? 'USD',
    dateFormat: _string(row['date_format']) ?? 'MMM d, yyyy',
    theme: ThemePreferenceX.parse(_string(row['theme']) ?? 'system'),
    onboardingCompleted: _bool(row['onboarding_completed']),
    notificationPreferences: mapNotificationPreferences(row['notification_preferences']),
    createdAt: _string(row['created_at']) ?? '',
    updatedAt: _string(row['updated_at']) ?? '',
  );
}

Account mapAccount(Map<String, dynamic> row) {
  return Account(
    id: '${row['id']}',
    userId: '${row['user_id']}',
    name: _string(row['name']) ?? '',
    type: AccountTypeX.parse(_string(row['type']) ?? 'bank'),
    openingBalance: _number(row['opening_balance']),
    currency: _string(row['currency']) ?? 'USD',
    icon: _string(row['icon']) ?? 'Landmark',
    color: _string(row['color']) ?? '#3B82F6',
    status: AccountStatusX.parse(_string(row['status']) ?? 'active'),
    createdAt: _string(row['created_at']) ?? '',
    updatedAt: _string(row['updated_at']) ?? '',
  );
}

Category mapCategory(Map<String, dynamic> row) {
  return Category(
    id: '${row['id']}',
    userId: '${row['user_id']}',
    name: _string(row['name']) ?? '',
    kind: CategoryKindX.parse(_string(row['kind']) ?? 'expense'),
    icon: _string(row['icon']) ?? 'CircleEllipsis',
    color: _string(row['color']) ?? '#94A3B8',
    parentId: _string(row['parent_id']),
    sortOrder: _int(row['sort_order']),
    isSystem: _bool(row['is_system']),
    createdAt: _string(row['created_at']) ?? '',
    updatedAt: _string(row['updated_at']) ?? '',
  );
}

Transaction mapTransaction(Map<String, dynamic> row) {
  return Transaction(
    id: '${row['id']}',
    userId: '${row['user_id']}',
    type: TransactionTypeX.parse(_string(row['type']) ?? 'expense'),
    amount: _number(row['amount']),
    currency: _string(row['currency']) ?? 'USD',
    categoryId: _string(row['category_id']),
    subcategoryId: _string(row['subcategory_id']),
    accountId: '${row['account_id']}',
    toAccountId: _string(row['to_account_id']),
    merchant: _string(row['merchant']) ?? '',
    description: _string(row['description']) ?? '',
    notes: _string(row['notes']) ?? '',
    date: _string(row['date']) ?? '',
    paymentMethod: PaymentMethodX.parse(_string(row['payment_method']) ?? 'card'),
    tags: (row['tags'] as List?)?.map((item) => '$item').toList() ?? const [],
    recurringId: _string(row['recurring_id']),
    attachmentPath: _string(row['attachment_path']),
    attachmentName: _string(row['attachment_name']),
    isSample: _bool(row['is_sample']),
    createdAt: _string(row['created_at']) ?? '',
    updatedAt: _string(row['updated_at']) ?? '',
  );
}

Budget mapBudget(Map<String, dynamic> row) {
  return Budget(
    id: '${row['id']}',
    userId: '${row['user_id']}',
    name: _string(row['name']) ?? '',
    categoryId: _string(row['category_id']),
    limitAmount: _number(row['limit_amount']),
    period: BudgetPeriodX.parse(_string(row['period']) ?? 'monthly'),
    startDate: _string(row['start_date']) ?? '',
    endDate: _string(row['end_date']),
    alertThreshold: _number(row['alert_threshold']),
    createdAt: _string(row['created_at']) ?? '',
    updatedAt: _string(row['updated_at']) ?? '',
  );
}

RecurringTransaction mapRecurring(Map<String, dynamic> row) {
  return RecurringTransaction(
    id: '${row['id']}',
    userId: '${row['user_id']}',
    type: TransactionTypeX.parse(_string(row['type']) ?? 'expense'),
    amount: _number(row['amount']),
    currency: _string(row['currency']) ?? 'USD',
    categoryId: _string(row['category_id']),
    accountId: '${row['account_id']}',
    merchant: _string(row['merchant']) ?? '',
    notes: _string(row['notes']) ?? '',
    paymentMethod: PaymentMethodX.parse(_string(row['payment_method']) ?? 'card'),
    frequency: RecurrenceFrequencyX.parse(_string(row['frequency']) ?? 'monthly'),
    interval: _int(row['interval'] ?? 1),
    startDate: _string(row['start_date']) ?? '',
    endDate: _string(row['end_date']),
    nextOccurrence: _string(row['next_occurrence']) ?? '',
    active: row['active'] == false ? false : true,
    createdAt: _string(row['created_at']) ?? '',
    updatedAt: _string(row['updated_at']) ?? '',
  );
}

Goal mapGoal(Map<String, dynamic> row) {
  return Goal(
    id: '${row['id']}',
    userId: '${row['user_id']}',
    name: _string(row['name']) ?? '',
    targetAmount: _number(row['target_amount']),
    currentAmount: _number(row['current_amount']),
    deadline: _string(row['deadline']),
    icon: _string(row['icon']) ?? 'Target',
    color: _string(row['color']) ?? '#A855F7',
    createdAt: _string(row['created_at']) ?? '',
    updatedAt: _string(row['updated_at']) ?? '',
  );
}

AppNotification mapNotification(Map<String, dynamic> row) {
  return AppNotification(
    id: '${row['id']}',
    userId: '${row['user_id']}',
    type: NotificationTypeX.parse(_string(row['type']) ?? 'budget_exceeded'),
    title: _string(row['title']) ?? '',
    body: _string(row['body']) ?? '',
    read: _bool(row['read']),
    metadata: _map(row['metadata']).map((key, value) => MapEntry(key, '$value')),
    createdAt: _string(row['created_at']) ?? '',
  );
}

SavedFilter mapSavedFilter(Map<String, dynamic> row) {
  return SavedFilter(
    id: '${row['id']}',
    userId: '${row['user_id']}',
    name: _string(row['name']) ?? '',
    filters: TransactionFilters.fromJson(_map(row['filters'])),
    createdAt: _string(row['created_at']) ?? '',
  );
}

Map<String, dynamic> transactionToRow(Map<String, dynamic> input, [String? userId]) {
  return camelPatchToRow(input, userId: userId);
}
