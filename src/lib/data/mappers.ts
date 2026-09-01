import { DEFAULT_NOTIFICATION_PREFERENCES } from '@/lib/defaults'
import type {
  Account,
  AppNotification,
  Budget,
  Category,
  Goal,
  NotificationPreferences,
  Profile,
  RecurringTransaction,
  SavedFilter,
  Transaction,
} from '@/types'

export function mapProfile(row: Record<string, unknown>, email: string): Profile {
  return {
    id: String(row.id),
    email,
    fullName: String(row.full_name ?? ''),
    avatarUrl: (row.avatar_url as string | null) ?? null,
    currency: String(row.currency ?? 'USD'),
    dateFormat: String(row.date_format ?? 'MMM d, yyyy'),
    theme: (row.theme as Profile['theme']) ?? 'system',
    onboardingCompleted: Boolean(row.onboarding_completed),
    notificationPreferences: {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...((row.notification_preferences as NotificationPreferences | null) ?? {}),
    },
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

export function mapAccount(row: Record<string, unknown>): Account {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    name: String(row.name),
    type: row.type as Account['type'],
    openingBalance: Number(row.opening_balance),
    currency: String(row.currency),
    icon: String(row.icon),
    color: String(row.color),
    status: row.status as Account['status'],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

export function mapCategory(row: Record<string, unknown>): Category {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    name: String(row.name),
    kind: row.kind as Category['kind'],
    icon: String(row.icon),
    color: String(row.color),
    parentId: (row.parent_id as string | null) ?? null,
    sortOrder: Number(row.sort_order ?? 0),
    isSystem: Boolean(row.is_system),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

export function mapTransaction(row: Record<string, unknown>): Transaction {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    type: row.type as Transaction['type'],
    amount: Number(row.amount),
    currency: String(row.currency),
    categoryId: (row.category_id as string | null) ?? null,
    subcategoryId: (row.subcategory_id as string | null) ?? null,
    accountId: String(row.account_id),
    toAccountId: (row.to_account_id as string | null) ?? null,
    merchant: String(row.merchant ?? ''),
    description: String(row.description ?? ''),
    notes: String(row.notes ?? ''),
    date: String(row.date),
    paymentMethod: row.payment_method as Transaction['paymentMethod'],
    tags: (row.tags as string[]) ?? [],
    recurringId: (row.recurring_id as string | null) ?? null,
    attachmentPath: (row.attachment_path as string | null) ?? null,
    attachmentName: (row.attachment_name as string | null) ?? null,
    isSample: Boolean(row.is_sample),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

export function mapBudget(row: Record<string, unknown>): Budget {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    name: String(row.name),
    categoryId: (row.category_id as string | null) ?? null,
    limitAmount: Number(row.limit_amount),
    period: row.period as Budget['period'],
    startDate: String(row.start_date),
    endDate: (row.end_date as string | null) ?? null,
    alertThreshold: Number(row.alert_threshold),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

export function mapRecurring(row: Record<string, unknown>): RecurringTransaction {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    type: row.type as RecurringTransaction['type'],
    amount: Number(row.amount),
    currency: String(row.currency),
    categoryId: (row.category_id as string | null) ?? null,
    accountId: String(row.account_id),
    merchant: String(row.merchant ?? ''),
    notes: String(row.notes ?? ''),
    paymentMethod: row.payment_method as RecurringTransaction['paymentMethod'],
    frequency: row.frequency as RecurringTransaction['frequency'],
    interval: Number(row.interval ?? 1),
    startDate: String(row.start_date),
    endDate: (row.end_date as string | null) ?? null,
    nextOccurrence: String(row.next_occurrence),
    active: Boolean(row.active),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

export function mapGoal(row: Record<string, unknown>): Goal {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    name: String(row.name),
    targetAmount: Number(row.target_amount),
    currentAmount: Number(row.current_amount),
    deadline: (row.deadline as string | null) ?? null,
    icon: String(row.icon),
    color: String(row.color),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

export function mapNotification(row: Record<string, unknown>): AppNotification {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    type: row.type as AppNotification['type'],
    title: String(row.title),
    body: String(row.body),
    read: Boolean(row.read),
    metadata: (row.metadata as Record<string, string>) ?? {},
    createdAt: String(row.created_at),
  }
}

export function mapSavedFilter(row: Record<string, unknown>): SavedFilter {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    name: String(row.name),
    filters: (row.filters as SavedFilter['filters']) ?? {},
    createdAt: String(row.created_at),
  }
}

export function transactionToRow(input: Partial<Transaction>, userId?: string) {
  return {
    ...(userId ? { user_id: userId } : {}),
    type: input.type,
    amount: input.amount,
    currency: input.currency,
    category_id: input.categoryId ?? null,
    subcategory_id: input.subcategoryId ?? null,
    account_id: input.accountId,
    to_account_id: input.toAccountId ?? null,
    merchant: input.merchant ?? '',
    description: input.description ?? '',
    notes: input.notes ?? '',
    date: input.date,
    payment_method: input.paymentMethod,
    tags: input.tags ?? [],
    recurring_id: input.recurringId ?? null,
    attachment_path: input.attachmentPath ?? null,
    attachment_name: input.attachmentName ?? null,
    is_sample: input.isSample ?? false,
  }
}
