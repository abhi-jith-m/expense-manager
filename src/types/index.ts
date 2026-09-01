export const TransactionType = {
  Expense: 'expense',
  Income: 'income',
  Transfer: 'transfer',
} as const
export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType]

export const AccountType = {
  Cash: 'cash',
  Bank: 'bank',
  Credit: 'credit',
  Savings: 'savings',
  Wallet: 'wallet',
} as const
export type AccountType = (typeof AccountType)[keyof typeof AccountType]

export const AccountStatus = {
  Active: 'active',
  Archived: 'archived',
} as const
export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus]

export const CategoryKind = {
  Expense: 'expense',
  Income: 'income',
} as const
export type CategoryKind = (typeof CategoryKind)[keyof typeof CategoryKind]

export const PaymentMethod = {
  Cash: 'cash',
  Card: 'card',
  Upi: 'upi',
  BankTransfer: 'bank_transfer',
  Wallet: 'wallet',
  Other: 'other',
} as const
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod]

export const BudgetPeriod = {
  Weekly: 'weekly',
  Monthly: 'monthly',
  Yearly: 'yearly',
  Custom: 'custom',
} as const
export type BudgetPeriod = (typeof BudgetPeriod)[keyof typeof BudgetPeriod]

export const RecurrenceFrequency = {
  Daily: 'daily',
  Weekly: 'weekly',
  Monthly: 'monthly',
  Yearly: 'yearly',
  Custom: 'custom',
} as const
export type RecurrenceFrequency =
  (typeof RecurrenceFrequency)[keyof typeof RecurrenceFrequency]

export const ThemePreference = {
  Light: 'light',
  Dark: 'dark',
  System: 'system',
} as const
export type ThemePreference = (typeof ThemePreference)[keyof typeof ThemePreference]

export const NotificationType = {
  BudgetExceeded: 'budget_exceeded',
  BudgetNearLimit: 'budget_near_limit',
  RecurringDue: 'recurring_due',
  GoalMilestone: 'goal_milestone',
  ImportCompleted: 'import_completed',
  ExportCompleted: 'export_completed',
} as const
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType]

export interface NotificationPreferences {
  budgetAlerts: boolean
  recurringAlerts: boolean
  goalAlerts: boolean
  importExportAlerts: boolean
}

export interface Profile {
  id: string
  email: string
  fullName: string
  avatarUrl: string | null
  currency: string
  dateFormat: string
  theme: ThemePreference
  onboardingCompleted: boolean
  notificationPreferences: NotificationPreferences
  createdAt: string
  updatedAt: string
}

export interface Account {
  id: string
  userId: string
  name: string
  type: AccountType
  openingBalance: number
  currency: string
  icon: string
  color: string
  status: AccountStatus
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  userId: string
  name: string
  kind: CategoryKind
  icon: string
  color: string
  parentId: string | null
  sortOrder: number
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

export interface Transaction {
  id: string
  userId: string
  type: TransactionType
  amount: number
  currency: string
  categoryId: string | null
  subcategoryId: string | null
  accountId: string
  toAccountId: string | null
  merchant: string
  description: string
  notes: string
  date: string
  paymentMethod: PaymentMethod
  tags: string[]
  recurringId: string | null
  attachmentPath: string | null
  attachmentName: string | null
  isSample: boolean
  createdAt: string
  updatedAt: string
}

export interface Budget {
  id: string
  userId: string
  name: string
  categoryId: string | null
  limitAmount: number
  period: BudgetPeriod
  startDate: string
  endDate: string | null
  alertThreshold: number
  createdAt: string
  updatedAt: string
}

export interface RecurringTransaction {
  id: string
  userId: string
  type: TransactionType
  amount: number
  currency: string
  categoryId: string | null
  accountId: string
  merchant: string
  notes: string
  paymentMethod: PaymentMethod
  frequency: RecurrenceFrequency
  interval: number
  startDate: string
  endDate: string | null
  nextOccurrence: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface Goal {
  id: string
  userId: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline: string | null
  icon: string
  color: string
  createdAt: string
  updatedAt: string
}

export interface AppNotification {
  id: string
  userId: string
  type: NotificationType
  title: string
  body: string
  read: boolean
  metadata: Record<string, string>
  createdAt: string
}

export interface SavedFilter {
  id: string
  userId: string
  name: string
  filters: TransactionFilters
  createdAt: string
}

export interface TransactionFilters {
  query?: string
  type?: TransactionType | 'all'
  categoryId?: string
  accountId?: string
  paymentMethod?: PaymentMethod
  tag?: string
  dateFrom?: string
  dateTo?: string
  amountMin?: number
  amountMax?: number
}

export interface Session {
  user: Profile
  accessToken: string
}

export interface DateRange {
  from: Date
  to: Date
  label: string
}

export interface ImportRowError {
  row: number
  field: string
  message: string
}

export interface MappedImportRow {
  row: number
  transaction: Omit<
    Transaction,
    'id' | 'userId' | 'createdAt' | 'updatedAt' | 'attachmentPath' | 'attachmentName'
  >
  errors: ImportRowError[]
}

export type SortDirection = 'asc' | 'desc'

export interface TransactionSort {
  field: 'date' | 'amount' | 'merchant' | 'createdAt'
  direction: SortDirection
}
