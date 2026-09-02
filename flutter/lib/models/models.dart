enum TransactionType { expense, income, transfer }

enum AccountType { cash, bank, credit, savings, wallet }

enum AccountStatus { active, archived }

enum CategoryKind { expense, income }

enum PaymentMethod { cash, card, upi, bankTransfer, wallet, other }

enum BudgetPeriod { weekly, monthly, yearly, custom }

enum RecurrenceFrequency { daily, weekly, monthly, yearly, custom }

enum ThemePreference { light, dark, system }

enum NotificationType {
  budgetExceeded,
  budgetNearLimit,
  recurringDue,
  goalMilestone,
  importCompleted,
  exportCompleted,
}

enum SortDirection { asc, desc }

enum TransactionSortField { date, amount, merchant, createdAt }

extension TransactionTypeX on TransactionType {
  String get value => switch (this) {
        TransactionType.expense => 'expense',
        TransactionType.income => 'income',
        TransactionType.transfer => 'transfer',
      };

  static TransactionType parse(String raw) => switch (raw) {
        'income' => TransactionType.income,
        'transfer' => TransactionType.transfer,
        _ => TransactionType.expense,
      };
}

extension AccountTypeX on AccountType {
  String get value => name;
  static AccountType parse(String raw) => AccountType.values.firstWhere(
        (item) => item.name == raw,
        orElse: () => AccountType.bank,
      );
}

extension AccountStatusX on AccountStatus {
  String get value => name;
  static AccountStatus parse(String raw) =>
      raw == 'archived' ? AccountStatus.archived : AccountStatus.active;
}

extension CategoryKindX on CategoryKind {
  String get value => name;
  static CategoryKind parse(String raw) =>
      raw == 'income' ? CategoryKind.income : CategoryKind.expense;
}

extension PaymentMethodX on PaymentMethod {
  String get value => switch (this) {
        PaymentMethod.bankTransfer => 'bank_transfer',
        _ => name,
      };

  String get label => switch (this) {
        PaymentMethod.cash => 'Cash',
        PaymentMethod.card => 'Card',
        PaymentMethod.upi => 'UPI',
        PaymentMethod.bankTransfer => 'Bank transfer',
        PaymentMethod.wallet => 'Wallet',
        PaymentMethod.other => 'Other',
      };

  static PaymentMethod parse(String raw) => switch (raw) {
        'cash' => PaymentMethod.cash,
        'upi' => PaymentMethod.upi,
        'bank_transfer' => PaymentMethod.bankTransfer,
        'wallet' => PaymentMethod.wallet,
        'other' => PaymentMethod.other,
        _ => PaymentMethod.card,
      };
}

extension BudgetPeriodX on BudgetPeriod {
  String get value => name;
  static BudgetPeriod parse(String raw) => BudgetPeriod.values.firstWhere(
        (item) => item.name == raw,
        orElse: () => BudgetPeriod.monthly,
      );
}

extension RecurrenceFrequencyX on RecurrenceFrequency {
  String get value => name;
  static RecurrenceFrequency parse(String raw) => RecurrenceFrequency.values.firstWhere(
        (item) => item.name == raw,
        orElse: () => RecurrenceFrequency.monthly,
      );
}

extension ThemePreferenceX on ThemePreference {
  String get value => name;
  static ThemePreference parse(String raw) => ThemePreference.values.firstWhere(
        (item) => item.name == raw,
        orElse: () => ThemePreference.system,
      );
}

extension NotificationTypeX on NotificationType {
  String get value => switch (this) {
        NotificationType.budgetExceeded => 'budget_exceeded',
        NotificationType.budgetNearLimit => 'budget_near_limit',
        NotificationType.recurringDue => 'recurring_due',
        NotificationType.goalMilestone => 'goal_milestone',
        NotificationType.importCompleted => 'import_completed',
        NotificationType.exportCompleted => 'export_completed',
      };

  static NotificationType parse(String raw) => switch (raw) {
        'budget_near_limit' => NotificationType.budgetNearLimit,
        'recurring_due' => NotificationType.recurringDue,
        'goal_milestone' => NotificationType.goalMilestone,
        'import_completed' => NotificationType.importCompleted,
        'export_completed' => NotificationType.exportCompleted,
        _ => NotificationType.budgetExceeded,
      };
}

class NotificationPreferences {
  const NotificationPreferences({
    required this.budgetAlerts,
    required this.recurringAlerts,
    required this.goalAlerts,
    required this.importExportAlerts,
  });

  final bool budgetAlerts;
  final bool recurringAlerts;
  final bool goalAlerts;
  final bool importExportAlerts;

  NotificationPreferences copyWith({
    bool? budgetAlerts,
    bool? recurringAlerts,
    bool? goalAlerts,
    bool? importExportAlerts,
  }) {
    return NotificationPreferences(
      budgetAlerts: budgetAlerts ?? this.budgetAlerts,
      recurringAlerts: recurringAlerts ?? this.recurringAlerts,
      goalAlerts: goalAlerts ?? this.goalAlerts,
      importExportAlerts: importExportAlerts ?? this.importExportAlerts,
    );
  }

  Map<String, dynamic> toJson() => {
        'budgetAlerts': budgetAlerts,
        'recurringAlerts': recurringAlerts,
        'goalAlerts': goalAlerts,
        'importExportAlerts': importExportAlerts,
      };

  factory NotificationPreferences.fromJson(Map<String, dynamic> json) {
    return NotificationPreferences(
      budgetAlerts: json['budgetAlerts'] as bool? ?? true,
      recurringAlerts: json['recurringAlerts'] as bool? ?? true,
      goalAlerts: json['goalAlerts'] as bool? ?? true,
      importExportAlerts: json['importExportAlerts'] as bool? ?? true,
    );
  }
}

class Profile {
  const Profile({
    required this.id,
    required this.email,
    required this.fullName,
    required this.avatarUrl,
    required this.currency,
    required this.dateFormat,
    required this.theme,
    required this.onboardingCompleted,
    required this.notificationPreferences,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String email;
  final String fullName;
  final String? avatarUrl;
  final String currency;
  final String dateFormat;
  final ThemePreference theme;
  final bool onboardingCompleted;
  final NotificationPreferences notificationPreferences;
  final String createdAt;
  final String updatedAt;

  Profile copyWith({
    String? email,
    String? fullName,
    String? avatarUrl,
    bool clearAvatar = false,
    String? currency,
    String? dateFormat,
    ThemePreference? theme,
    bool? onboardingCompleted,
    NotificationPreferences? notificationPreferences,
    String? updatedAt,
  }) {
    return Profile(
      id: id,
      email: email ?? this.email,
      fullName: fullName ?? this.fullName,
      avatarUrl: clearAvatar ? null : (avatarUrl ?? this.avatarUrl),
      currency: currency ?? this.currency,
      dateFormat: dateFormat ?? this.dateFormat,
      theme: theme ?? this.theme,
      onboardingCompleted: onboardingCompleted ?? this.onboardingCompleted,
      notificationPreferences: notificationPreferences ?? this.notificationPreferences,
      createdAt: createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'fullName': fullName,
        'avatarUrl': avatarUrl,
        'currency': currency,
        'dateFormat': dateFormat,
        'theme': theme.value,
        'onboardingCompleted': onboardingCompleted,
        'notificationPreferences': notificationPreferences.toJson(),
        'createdAt': createdAt,
        'updatedAt': updatedAt,
      };

  factory Profile.fromJson(Map<String, dynamic> json) {
    return Profile(
      id: json['id'] as String,
      email: json['email'] as String,
      fullName: json['fullName'] as String? ?? '',
      avatarUrl: json['avatarUrl'] as String?,
      currency: json['currency'] as String? ?? 'USD',
      dateFormat: json['dateFormat'] as String? ?? 'MMM d, yyyy',
      theme: ThemePreferenceX.parse(json['theme'] as String? ?? 'system'),
      onboardingCompleted: json['onboardingCompleted'] as bool? ?? false,
      notificationPreferences: NotificationPreferences.fromJson(
        Map<String, dynamic>.from(json['notificationPreferences'] as Map? ?? {}),
      ),
      createdAt: json['createdAt'] as String? ?? '',
      updatedAt: json['updatedAt'] as String? ?? '',
    );
  }
}

class Account {
  const Account({
    required this.id,
    required this.userId,
    required this.name,
    required this.type,
    required this.openingBalance,
    required this.currency,
    required this.icon,
    required this.color,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String userId;
  final String name;
  final AccountType type;
  final double openingBalance;
  final String currency;
  final String icon;
  final String color;
  final AccountStatus status;
  final String createdAt;
  final String updatedAt;

  Account copyWith({
    String? name,
    AccountType? type,
    double? openingBalance,
    String? currency,
    String? icon,
    String? color,
    AccountStatus? status,
    String? updatedAt,
  }) {
    return Account(
      id: id,
      userId: userId,
      name: name ?? this.name,
      type: type ?? this.type,
      openingBalance: openingBalance ?? this.openingBalance,
      currency: currency ?? this.currency,
      icon: icon ?? this.icon,
      color: color ?? this.color,
      status: status ?? this.status,
      createdAt: createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'userId': userId,
        'name': name,
        'type': type.value,
        'openingBalance': openingBalance,
        'currency': currency,
        'icon': icon,
        'color': color,
        'status': status.value,
        'createdAt': createdAt,
        'updatedAt': updatedAt,
      };

  factory Account.fromJson(Map<String, dynamic> json) {
    return Account(
      id: json['id'] as String,
      userId: json['userId'] as String,
      name: json['name'] as String,
      type: AccountTypeX.parse(json['type'] as String? ?? 'bank'),
      openingBalance: (json['openingBalance'] as num?)?.toDouble() ?? 0,
      currency: json['currency'] as String? ?? 'USD',
      icon: json['icon'] as String? ?? 'Landmark',
      color: json['color'] as String? ?? '#3B82F6',
      status: AccountStatusX.parse(json['status'] as String? ?? 'active'),
      createdAt: json['createdAt'] as String? ?? '',
      updatedAt: json['updatedAt'] as String? ?? '',
    );
  }
}

class Category {
  const Category({
    required this.id,
    required this.userId,
    required this.name,
    required this.kind,
    required this.icon,
    required this.color,
    required this.parentId,
    required this.sortOrder,
    required this.isSystem,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String userId;
  final String name;
  final CategoryKind kind;
  final String icon;
  final String color;
  final String? parentId;
  final int sortOrder;
  final bool isSystem;
  final String createdAt;
  final String updatedAt;

  Category copyWith({
    String? name,
    CategoryKind? kind,
    String? icon,
    String? color,
    String? parentId,
    bool clearParent = false,
    int? sortOrder,
    String? updatedAt,
  }) {
    return Category(
      id: id,
      userId: userId,
      name: name ?? this.name,
      kind: kind ?? this.kind,
      icon: icon ?? this.icon,
      color: color ?? this.color,
      parentId: clearParent ? null : (parentId ?? this.parentId),
      sortOrder: sortOrder ?? this.sortOrder,
      isSystem: isSystem,
      createdAt: createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'userId': userId,
        'name': name,
        'kind': kind.value,
        'icon': icon,
        'color': color,
        'parentId': parentId,
        'sortOrder': sortOrder,
        'isSystem': isSystem,
        'createdAt': createdAt,
        'updatedAt': updatedAt,
      };

  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      id: json['id'] as String,
      userId: json['userId'] as String,
      name: json['name'] as String,
      kind: CategoryKindX.parse(json['kind'] as String? ?? 'expense'),
      icon: json['icon'] as String? ?? 'CircleEllipsis',
      color: json['color'] as String? ?? '#94A3B8',
      parentId: json['parentId'] as String?,
      sortOrder: (json['sortOrder'] as num?)?.toInt() ?? 0,
      isSystem: json['isSystem'] as bool? ?? false,
      createdAt: json['createdAt'] as String? ?? '',
      updatedAt: json['updatedAt'] as String? ?? '',
    );
  }
}

class Transaction {
  const Transaction({
    required this.id,
    required this.userId,
    required this.type,
    required this.amount,
    required this.currency,
    required this.categoryId,
    required this.subcategoryId,
    required this.accountId,
    required this.toAccountId,
    required this.merchant,
    required this.description,
    required this.notes,
    required this.date,
    required this.paymentMethod,
    required this.tags,
    required this.recurringId,
    required this.attachmentPath,
    required this.attachmentName,
    required this.isSample,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String userId;
  final TransactionType type;
  final double amount;
  final String currency;
  final String? categoryId;
  final String? subcategoryId;
  final String accountId;
  final String? toAccountId;
  final String merchant;
  final String description;
  final String notes;
  final String date;
  final PaymentMethod paymentMethod;
  final List<String> tags;
  final String? recurringId;
  final String? attachmentPath;
  final String? attachmentName;
  final bool isSample;
  final String createdAt;
  final String updatedAt;

  Transaction copyWith({
    TransactionType? type,
    double? amount,
    String? currency,
    String? categoryId,
    bool clearCategory = false,
    String? subcategoryId,
    bool clearSubcategory = false,
    String? accountId,
    String? toAccountId,
    bool clearToAccount = false,
    String? merchant,
    String? description,
    String? notes,
    String? date,
    PaymentMethod? paymentMethod,
    List<String>? tags,
    String? recurringId,
    bool clearRecurring = false,
    String? attachmentPath,
    String? attachmentName,
    bool clearAttachment = false,
    bool? isSample,
    String? updatedAt,
  }) {
    return Transaction(
      id: id,
      userId: userId,
      type: type ?? this.type,
      amount: amount ?? this.amount,
      currency: currency ?? this.currency,
      categoryId: clearCategory ? null : (categoryId ?? this.categoryId),
      subcategoryId: clearSubcategory ? null : (subcategoryId ?? this.subcategoryId),
      accountId: accountId ?? this.accountId,
      toAccountId: clearToAccount ? null : (toAccountId ?? this.toAccountId),
      merchant: merchant ?? this.merchant,
      description: description ?? this.description,
      notes: notes ?? this.notes,
      date: date ?? this.date,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      tags: tags ?? this.tags,
      recurringId: clearRecurring ? null : (recurringId ?? this.recurringId),
      attachmentPath: clearAttachment ? null : (attachmentPath ?? this.attachmentPath),
      attachmentName: clearAttachment ? null : (attachmentName ?? this.attachmentName),
      isSample: isSample ?? this.isSample,
      createdAt: createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'userId': userId,
        'type': type.value,
        'amount': amount,
        'currency': currency,
        'categoryId': categoryId,
        'subcategoryId': subcategoryId,
        'accountId': accountId,
        'toAccountId': toAccountId,
        'merchant': merchant,
        'description': description,
        'notes': notes,
        'date': date,
        'paymentMethod': paymentMethod.value,
        'tags': tags,
        'recurringId': recurringId,
        'attachmentPath': attachmentPath,
        'attachmentName': attachmentName,
        'isSample': isSample,
        'createdAt': createdAt,
        'updatedAt': updatedAt,
      };

  factory Transaction.fromJson(Map<String, dynamic> json) {
    return Transaction(
      id: json['id'] as String,
      userId: json['userId'] as String,
      type: TransactionTypeX.parse(json['type'] as String? ?? 'expense'),
      amount: (json['amount'] as num?)?.toDouble() ?? 0,
      currency: json['currency'] as String? ?? 'USD',
      categoryId: json['categoryId'] as String?,
      subcategoryId: json['subcategoryId'] as String?,
      accountId: json['accountId'] as String,
      toAccountId: json['toAccountId'] as String?,
      merchant: json['merchant'] as String? ?? '',
      description: json['description'] as String? ?? '',
      notes: json['notes'] as String? ?? '',
      date: json['date'] as String? ?? '',
      paymentMethod: PaymentMethodX.parse(json['paymentMethod'] as String? ?? 'card'),
      tags: (json['tags'] as List?)?.map((item) => item.toString()).toList() ?? const [],
      recurringId: json['recurringId'] as String?,
      attachmentPath: json['attachmentPath'] as String?,
      attachmentName: json['attachmentName'] as String?,
      isSample: json['isSample'] as bool? ?? false,
      createdAt: json['createdAt'] as String? ?? '',
      updatedAt: json['updatedAt'] as String? ?? '',
    );
  }
}

class Budget {
  const Budget({
    required this.id,
    required this.userId,
    required this.name,
    required this.categoryId,
    required this.limitAmount,
    required this.period,
    required this.startDate,
    required this.endDate,
    required this.alertThreshold,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String userId;
  final String name;
  final String? categoryId;
  final double limitAmount;
  final BudgetPeriod period;
  final String startDate;
  final String? endDate;
  final double alertThreshold;
  final String createdAt;
  final String updatedAt;

  Map<String, dynamic> toJson() => {
        'id': id,
        'userId': userId,
        'name': name,
        'categoryId': categoryId,
        'limitAmount': limitAmount,
        'period': period.value,
        'startDate': startDate,
        'endDate': endDate,
        'alertThreshold': alertThreshold,
        'createdAt': createdAt,
        'updatedAt': updatedAt,
      };

  factory Budget.fromJson(Map<String, dynamic> json) {
    return Budget(
      id: json['id'] as String,
      userId: json['userId'] as String,
      name: json['name'] as String,
      categoryId: json['categoryId'] as String?,
      limitAmount: (json['limitAmount'] as num?)?.toDouble() ?? 0,
      period: BudgetPeriodX.parse(json['period'] as String? ?? 'monthly'),
      startDate: json['startDate'] as String? ?? '',
      endDate: json['endDate'] as String?,
      alertThreshold: (json['alertThreshold'] as num?)?.toDouble() ?? 80,
      createdAt: json['createdAt'] as String? ?? '',
      updatedAt: json['updatedAt'] as String? ?? '',
    );
  }
}

class RecurringTransaction {
  RecurringTransaction({
    required this.id,
    required this.userId,
    required this.type,
    required this.amount,
    required this.currency,
    required this.categoryId,
    required this.accountId,
    required this.merchant,
    required this.notes,
    required this.paymentMethod,
    required this.frequency,
    required this.interval,
    required this.startDate,
    required this.endDate,
    required this.nextOccurrence,
    required this.active,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String userId;
  final TransactionType type;
  final double amount;
  final String currency;
  final String? categoryId;
  final String accountId;
  final String merchant;
  final String notes;
  final PaymentMethod paymentMethod;
  final RecurrenceFrequency frequency;
  final int interval;
  final String startDate;
  final String? endDate;
  String nextOccurrence;
  bool active;
  final String createdAt;
  String updatedAt;

  Map<String, dynamic> toJson() => {
        'id': id,
        'userId': userId,
        'type': type.value,
        'amount': amount,
        'currency': currency,
        'categoryId': categoryId,
        'accountId': accountId,
        'merchant': merchant,
        'notes': notes,
        'paymentMethod': paymentMethod.value,
        'frequency': frequency.value,
        'interval': interval,
        'startDate': startDate,
        'endDate': endDate,
        'nextOccurrence': nextOccurrence,
        'active': active,
        'createdAt': createdAt,
        'updatedAt': updatedAt,
      };

  factory RecurringTransaction.fromJson(Map<String, dynamic> json) {
    return RecurringTransaction(
      id: json['id'] as String,
      userId: json['userId'] as String,
      type: TransactionTypeX.parse(json['type'] as String? ?? 'expense'),
      amount: (json['amount'] as num?)?.toDouble() ?? 0,
      currency: json['currency'] as String? ?? 'USD',
      categoryId: json['categoryId'] as String?,
      accountId: json['accountId'] as String,
      merchant: json['merchant'] as String? ?? '',
      notes: json['notes'] as String? ?? '',
      paymentMethod: PaymentMethodX.parse(json['paymentMethod'] as String? ?? 'card'),
      frequency: RecurrenceFrequencyX.parse(json['frequency'] as String? ?? 'monthly'),
      interval: (json['interval'] as num?)?.toInt() ?? 1,
      startDate: json['startDate'] as String? ?? '',
      endDate: json['endDate'] as String?,
      nextOccurrence: json['nextOccurrence'] as String? ?? '',
      active: json['active'] as bool? ?? true,
      createdAt: json['createdAt'] as String? ?? '',
      updatedAt: json['updatedAt'] as String? ?? '',
    );
  }
}

class Goal {
  const Goal({
    required this.id,
    required this.userId,
    required this.name,
    required this.targetAmount,
    required this.currentAmount,
    required this.deadline,
    required this.icon,
    required this.color,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String userId;
  final String name;
  final double targetAmount;
  final double currentAmount;
  final String? deadline;
  final String icon;
  final String color;
  final String createdAt;
  final String updatedAt;

  Goal copyWith({double? currentAmount, String? updatedAt}) {
    return Goal(
      id: id,
      userId: userId,
      name: name,
      targetAmount: targetAmount,
      currentAmount: currentAmount ?? this.currentAmount,
      deadline: deadline,
      icon: icon,
      color: color,
      createdAt: createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'userId': userId,
        'name': name,
        'targetAmount': targetAmount,
        'currentAmount': currentAmount,
        'deadline': deadline,
        'icon': icon,
        'color': color,
        'createdAt': createdAt,
        'updatedAt': updatedAt,
      };

  factory Goal.fromJson(Map<String, dynamic> json) {
    return Goal(
      id: json['id'] as String,
      userId: json['userId'] as String,
      name: json['name'] as String,
      targetAmount: (json['targetAmount'] as num?)?.toDouble() ?? 0,
      currentAmount: (json['currentAmount'] as num?)?.toDouble() ?? 0,
      deadline: json['deadline'] as String?,
      icon: json['icon'] as String? ?? 'Target',
      color: json['color'] as String? ?? '#A855F7',
      createdAt: json['createdAt'] as String? ?? '',
      updatedAt: json['updatedAt'] as String? ?? '',
    );
  }
}

class AppNotification {
  const AppNotification({
    required this.id,
    required this.userId,
    required this.type,
    required this.title,
    required this.body,
    required this.read,
    required this.metadata,
    required this.createdAt,
  });

  final String id;
  final String userId;
  final NotificationType type;
  final String title;
  final String body;
  final bool read;
  final Map<String, String> metadata;
  final String createdAt;

  AppNotification copyWith({bool? read}) {
    return AppNotification(
      id: id,
      userId: userId,
      type: type,
      title: title,
      body: body,
      read: read ?? this.read,
      metadata: metadata,
      createdAt: createdAt,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'userId': userId,
        'type': type.value,
        'title': title,
        'body': body,
        'read': read,
        'metadata': metadata,
        'createdAt': createdAt,
      };

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['id'] as String,
      userId: json['userId'] as String,
      type: NotificationTypeX.parse(json['type'] as String? ?? 'budget_exceeded'),
      title: json['title'] as String? ?? '',
      body: json['body'] as String? ?? '',
      read: json['read'] as bool? ?? false,
      metadata: (json['metadata'] as Map?)?.map((key, value) => MapEntry('$key', '$value')) ?? {},
      createdAt: json['createdAt'] as String? ?? '',
    );
  }
}

class TransactionFilters {
  const TransactionFilters({
    this.query,
    this.type,
    this.categoryId,
    this.accountId,
    this.paymentMethod,
    this.tag,
    this.dateFrom,
    this.dateTo,
    this.amountMin,
    this.amountMax,
  });

  final String? query;
  final TransactionType? type;
  final String? categoryId;
  final String? accountId;
  final PaymentMethod? paymentMethod;
  final String? tag;
  final String? dateFrom;
  final String? dateTo;
  final double? amountMin;
  final double? amountMax;

  TransactionFilters copyWith({
    String? query,
    TransactionType? type,
    bool clearType = false,
    String? categoryId,
    bool clearCategory = false,
    String? accountId,
    bool clearAccount = false,
    PaymentMethod? paymentMethod,
    bool clearPayment = false,
    String? tag,
    String? dateFrom,
    String? dateTo,
    double? amountMin,
    double? amountMax,
  }) {
    return TransactionFilters(
      query: query ?? this.query,
      type: clearType ? null : (type ?? this.type),
      categoryId: clearCategory ? null : (categoryId ?? this.categoryId),
      accountId: clearAccount ? null : (accountId ?? this.accountId),
      paymentMethod: clearPayment ? null : (paymentMethod ?? this.paymentMethod),
      tag: tag ?? this.tag,
      dateFrom: dateFrom ?? this.dateFrom,
      dateTo: dateTo ?? this.dateTo,
      amountMin: amountMin ?? this.amountMin,
      amountMax: amountMax ?? this.amountMax,
    );
  }

  Map<String, dynamic> toJson() => {
        'query': query,
        'type': type?.value,
        'categoryId': categoryId,
        'accountId': accountId,
        'paymentMethod': paymentMethod?.value,
        'tag': tag,
        'dateFrom': dateFrom,
        'dateTo': dateTo,
        'amountMin': amountMin,
        'amountMax': amountMax,
      };

  factory TransactionFilters.fromJson(Map<String, dynamic> json) {
    final typeRaw = json['type'] as String?;
    return TransactionFilters(
      query: json['query'] as String?,
      type: typeRaw == null || typeRaw == 'all' ? null : TransactionTypeX.parse(typeRaw),
      categoryId: json['categoryId'] as String?,
      accountId: json['accountId'] as String?,
      paymentMethod:
          json['paymentMethod'] == null ? null : PaymentMethodX.parse(json['paymentMethod'] as String),
      tag: json['tag'] as String?,
      dateFrom: json['dateFrom'] as String?,
      dateTo: json['dateTo'] as String?,
      amountMin: (json['amountMin'] as num?)?.toDouble(),
      amountMax: (json['amountMax'] as num?)?.toDouble(),
    );
  }
}

class SavedFilter {
  const SavedFilter({
    required this.id,
    required this.userId,
    required this.name,
    required this.filters,
    required this.createdAt,
  });

  final String id;
  final String userId;
  final String name;
  final TransactionFilters filters;
  final String createdAt;

  Map<String, dynamic> toJson() => {
        'id': id,
        'userId': userId,
        'name': name,
        'filters': filters.toJson(),
        'createdAt': createdAt,
      };

  factory SavedFilter.fromJson(Map<String, dynamic> json) {
    return SavedFilter(
      id: json['id'] as String,
      userId: json['userId'] as String,
      name: json['name'] as String,
      filters: TransactionFilters.fromJson(Map<String, dynamic>.from(json['filters'] as Map? ?? {})),
      createdAt: json['createdAt'] as String? ?? '',
    );
  }
}

class Session {
  const Session({required this.user, required this.accessToken});

  final Profile user;
  final String accessToken;

  Map<String, dynamic> toJson() => {
        'user': user.toJson(),
        'accessToken': accessToken,
      };

  factory Session.fromJson(Map<String, dynamic> json) {
    return Session(
      user: Profile.fromJson(Map<String, dynamic>.from(json['user'] as Map)),
      accessToken: json['accessToken'] as String? ?? '',
    );
  }
}

class DateRange {
  const DateRange({required this.from, required this.to, required this.label});

  final DateTime from;
  final DateTime to;
  final String label;
}

class ImportRowError {
  const ImportRowError({required this.row, required this.field, required this.message});

  final int row;
  final String field;
  final String message;
}

class MappedImportRow {
  const MappedImportRow({
    required this.row,
    required this.transaction,
    required this.errors,
  });

  final int row;
  final CreateTransactionInput transaction;
  final List<ImportRowError> errors;
}

class CreateTransactionInput {
  const CreateTransactionInput({
    required this.type,
    required this.amount,
    required this.currency,
    required this.categoryId,
    required this.subcategoryId,
    required this.accountId,
    required this.toAccountId,
    required this.merchant,
    required this.description,
    required this.notes,
    required this.date,
    required this.paymentMethod,
    required this.tags,
    required this.recurringId,
    required this.attachmentPath,
    required this.attachmentName,
    required this.isSample,
  });

  final TransactionType type;
  final double amount;
  final String currency;
  final String? categoryId;
  final String? subcategoryId;
  final String accountId;
  final String? toAccountId;
  final String merchant;
  final String description;
  final String notes;
  final String date;
  final PaymentMethod paymentMethod;
  final List<String> tags;
  final String? recurringId;
  final String? attachmentPath;
  final String? attachmentName;
  final bool isSample;

  Map<String, dynamic> toJson() => {
        'type': type.value,
        'amount': amount,
        'currency': currency,
        'categoryId': categoryId,
        'subcategoryId': subcategoryId,
        'accountId': accountId,
        'toAccountId': toAccountId,
        'merchant': merchant,
        'description': description,
        'notes': notes,
        'date': date,
        'paymentMethod': paymentMethod.value,
        'tags': tags,
        'recurringId': recurringId,
        'attachmentPath': attachmentPath,
        'attachmentName': attachmentName,
        'isSample': isSample,
      };
}

class Insight {
  const Insight({required this.id, required this.text});

  final String id;
  final String text;
}

class FinanceTotals {
  const FinanceTotals({
    required this.income,
    required this.expenses,
    required this.transfers,
    required this.savings,
    required this.savingsRate,
  });

  final double income;
  final double expenses;
  final double transfers;
  final double savings;
  final double savingsRate;
}
