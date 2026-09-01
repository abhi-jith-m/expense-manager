import type {
  Account,
  AppNotification,
  Budget,
  Category,
  Goal,
  Profile,
  RecurringTransaction,
  SavedFilter,
  Session,
  Transaction,
} from '@/types'

export interface CreateTransactionInput
  extends Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'> {}

export interface DataClient {
  backend: 'local' | 'supabase'
  getSession(): Promise<Session | null>
  onAuthChange(listener: (session: Session | null) => void): () => void
  signUp(email: string, password: string, fullName: string): Promise<Session>
  signIn(email: string, password: string): Promise<Session>
  signInWithGoogle(): Promise<void>
  signOut(): Promise<void>
  requestPasswordReset(email: string): Promise<void>
  updatePassword(password: string): Promise<void>
  updateProfile(patch: Partial<Profile>): Promise<Profile>
  uploadAvatar(file: File): Promise<string>
  deleteAccount(): Promise<void>

  listAccounts(): Promise<Account[]>
  createAccount(input: Omit<Account, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Account>
  updateAccount(id: string, patch: Partial<Account>): Promise<Account>
  deleteAccountRecord(id: string): Promise<void>

  listCategories(): Promise<Category[]>
  createCategory(input: Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Category>
  updateCategory(id: string, patch: Partial<Category>): Promise<Category>
  deleteCategory(id: string): Promise<void>
  reorderCategories(ids: string[]): Promise<void>

  listTransactions(): Promise<Transaction[]>
  createTransaction(input: CreateTransactionInput): Promise<Transaction>
  updateTransaction(id: string, patch: Partial<Transaction>): Promise<Transaction>
  deleteTransaction(id: string): Promise<void>
  deleteTransactions(ids: string[]): Promise<void>
  updateTransactions(ids: string[], patch: Partial<Transaction>): Promise<void>

  listBudgets(): Promise<Budget[]>
  createBudget(input: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Budget>
  updateBudget(id: string, patch: Partial<Budget>): Promise<Budget>
  deleteBudget(id: string): Promise<void>

  listRecurring(): Promise<RecurringTransaction[]>
  createRecurring(
    input: Omit<RecurringTransaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
  ): Promise<RecurringTransaction>
  updateRecurring(id: string, patch: Partial<RecurringTransaction>): Promise<RecurringTransaction>
  deleteRecurring(id: string): Promise<void>

  listGoals(): Promise<Goal[]>
  createGoal(input: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Goal>
  updateGoal(id: string, patch: Partial<Goal>): Promise<Goal>
  deleteGoal(id: string): Promise<void>

  listNotifications(): Promise<AppNotification[]>
  createNotification(
    input: Omit<AppNotification, 'id' | 'userId' | 'createdAt'>,
  ): Promise<AppNotification>
  markNotificationRead(id: string): Promise<void>
  markAllNotificationsRead(): Promise<void>
  deleteNotification(id: string): Promise<void>

  listSavedFilters(): Promise<SavedFilter[]>
  createSavedFilter(input: Omit<SavedFilter, 'id' | 'userId' | 'createdAt'>): Promise<SavedFilter>
  deleteSavedFilter(id: string): Promise<void>

  uploadReceipt(transactionId: string, file: File): Promise<{ path: string; name: string }>
  getReceiptUrl(path: string): Promise<string | null>
  deleteReceipt(path: string): Promise<void>

  exportAll(): Promise<unknown>
  importAll(payload: unknown): Promise<void>
}
