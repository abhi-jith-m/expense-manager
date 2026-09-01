import { format } from 'date-fns'
import { DEFAULT_CATEGORIES, DEFAULT_NOTIFICATION_PREFERENCES } from '@/lib/defaults'
import { nextOccurrence, toISODate } from '@/lib/dates'
import { AppError } from '@/lib/data/errors'
import { createId, fileToDataUrl, RECEIPT_MAX_BYTES } from '@/lib/utils'
import type { DataClient } from '@/lib/data/client'
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

const DB_KEY = 'aureum.db.v1'
const SESSION_KEY = 'aureum.session.v1'
const ATTACH_DB = 'aureum-attachments'

interface LocalUser {
  id: string
  email: string
  passwordHash: string
  salt: string
}

interface UserStore {
  profile: Profile
  accounts: Account[]
  categories: Category[]
  transactions: Transaction[]
  budgets: Budget[]
  recurring: RecurringTransaction[]
  goals: Goal[]
  notifications: AppNotification[]
  savedFilters: SavedFilter[]
}

interface Database {
  users: LocalUser[]
  stores: Record<string, UserStore>
}

const listeners = new Set<(session: Session | null) => void>()

function loadDb(): Database {
  const raw = localStorage.getItem(DB_KEY)
  if (!raw) return { users: [], stores: {} }
  try {
    return JSON.parse(raw) as Database
  } catch {
    return { users: [], stores: {} }
  }
}

function saveDb(db: Database): void {
  localStorage.setItem(DB_KEY, JSON.stringify(db))
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const encoded = new TextEncoder().encode(`${salt}:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function emptyStore(userId: string, email: string, fullName: string): UserStore {
  const now = new Date().toISOString()
  const categories: Category[] = DEFAULT_CATEGORIES.map((item, index) => ({
    id: createId(),
    userId,
    name: item.name,
    kind: item.kind,
    icon: item.icon,
    color: item.color,
    parentId: null,
    sortOrder: index,
    isSystem: true,
    createdAt: now,
    updatedAt: now,
  }))
  return {
    profile: {
      id: userId,
      email,
      fullName,
      avatarUrl: null,
      currency: 'USD',
      dateFormat: 'MMM d, yyyy',
      theme: 'dark',
      onboardingCompleted: false,
      notificationPreferences: { ...DEFAULT_NOTIFICATION_PREFERENCES },
      createdAt: now,
      updatedAt: now,
    },
    accounts: [],
    categories,
    transactions: [],
    budgets: [],
    recurring: [],
    goals: [],
    notifications: [],
    savedFilters: [],
  }
}

function requireUserId(): string {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) throw new AppError('Your session expired. Please sign in again.', 'unauthenticated')
  const session = JSON.parse(raw) as Session
  return session.user.id
}

function withStore<T>(mutate: (store: UserStore) => T): T {
  const userId = requireUserId()
  const db = loadDb()
  const store = db.stores[userId]
  if (!store) throw new AppError('Account data was not found.', 'not_found')
  const result = mutate(store)
  saveDb(db)
  return result
}

function openAttachDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(ATTACH_DB, 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore('files')
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function putAttachment(path: string, dataUrl: string): Promise<void> {
  const db = await openAttachDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite')
    tx.objectStore('files').put(dataUrl, path)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

async function getAttachment(path: string): Promise<string | null> {
  const db = await openAttachDb()
  const value = await new Promise<string | null>((resolve, reject) => {
    const tx = db.transaction('files', 'readonly')
    const request = tx.objectStore('files').get(path)
    request.onsuccess = () => resolve((request.result as string | undefined) ?? null)
    request.onerror = () => reject(request.error)
  })
  db.close()
  return value
}

async function deleteAttachment(path: string): Promise<void> {
  const db = await openAttachDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite')
    tx.objectStore('files').delete(path)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

function emit(session: Session | null): void {
  listeners.forEach((listener) => listener(session))
}

function sessionFromProfile(profile: Profile): Session {
  return { user: profile, accessToken: `local.${profile.id}` }
}

function generateDueRecurring(store: UserStore): void {
  const today = toISODate(new Date())
  for (const rule of store.recurring) {
    if (!rule.active) continue
    let guard = 0
    while (rule.nextOccurrence <= today && guard < 36) {
      const exists = store.transactions.some(
        (tx) => tx.recurringId === rule.id && tx.date === rule.nextOccurrence,
      )
      if (!exists) {
        const now = new Date().toISOString()
        store.transactions.unshift({
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
          tags: ['recurring'],
          recurringId: rule.id,
          attachmentPath: null,
          attachmentName: null,
          isSample: false,
          createdAt: now,
          updatedAt: now,
        })
      }
      const next = nextOccurrence(new Date(rule.nextOccurrence), rule.frequency, rule.interval)
      rule.nextOccurrence = format(next, 'yyyy-MM-dd')
      if (rule.endDate && rule.nextOccurrence > rule.endDate) {
        rule.active = false
        break
      }
      guard += 1
    }
  }
}

export function createLocalClient(): DataClient {
  const client: DataClient = {
    backend: 'local',

    async getSession() {
      const raw = localStorage.getItem(SESSION_KEY)
      if (!raw) return null
      const session = JSON.parse(raw) as Session
      const db = loadDb()
      const store = db.stores[session.user.id]
      if (!store) {
        localStorage.removeItem(SESSION_KEY)
        return null
      }
      generateDueRecurring(store)
      saveDb(db)
      return sessionFromProfile(store.profile)
    },

    onAuthChange(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },

    async signUp(email, password, fullName) {
      const db = loadDb()
      if (db.users.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
        throw new AppError('An account with this email already exists.', 'exists')
      }
      const id = createId()
      const salt = createId()
      const passwordHash = await hashPassword(password, salt)
      db.users.push({ id, email: email.toLowerCase(), passwordHash, salt })
      db.stores[id] = emptyStore(id, email.toLowerCase(), fullName)
      saveDb(db)
      const session = sessionFromProfile(db.stores[id].profile)
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
      emit(session)
      return session
    },

    async signIn(email, password) {
      const db = loadDb()
      const user = db.users.find((item) => item.email === email.toLowerCase())
      if (!user) throw new AppError('Email or password is incorrect.', 'invalid_credentials')
      const hash = await hashPassword(password, user.salt)
      if (hash !== user.passwordHash) throw new AppError('Email or password is incorrect.', 'invalid_credentials')
      const store = db.stores[user.id]
      generateDueRecurring(store)
      saveDb(db)
      const session = sessionFromProfile(store.profile)
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
      emit(session)
      return session
    },

    async signInWithGoogle() {
      throw new AppError('Google sign-in requires Supabase Auth. Add your project credentials to enable it.', 'unsupported')
    },

    async signOut() {
      localStorage.removeItem(SESSION_KEY)
      emit(null)
    },

    async requestPasswordReset(email) {
      const db = loadDb()
      if (!db.users.some((user) => user.email === email.toLowerCase())) return
    },

    async updatePassword(password) {
      const userId = requireUserId()
      const db = loadDb()
      const user = db.users.find((item) => item.id === userId)
      if (!user) throw new AppError('Account was not found.', 'not_found')
      user.salt = createId()
      user.passwordHash = await hashPassword(password, user.salt)
      saveDb(db)
    },

    async updateProfile(patch) {
      return withStore((store) => {
        store.profile = { ...store.profile, ...patch, updatedAt: new Date().toISOString() }
        const session = sessionFromProfile(store.profile)
        localStorage.setItem(SESSION_KEY, JSON.stringify(session))
        emit(session)
        return store.profile
      })
    },

    async uploadAvatar(file) {
      if (file.size > RECEIPT_MAX_BYTES) throw new AppError('Avatar must be under 8MB.', 'file_too_large')
      const dataUrl = await fileToDataUrl(file)
      await client.updateProfile({ avatarUrl: dataUrl })
      return dataUrl
    },

    async deleteAccount() {
      const userId = requireUserId()
      const db = loadDb()
      db.users = db.users.filter((user) => user.id !== userId)
      delete db.stores[userId]
      saveDb(db)
      localStorage.removeItem(SESSION_KEY)
      emit(null)
    },

    async listAccounts() {
      return withStore((store) => [...store.accounts])
    },
    async createAccount(input) {
      return withStore((store) => {
        const now = new Date().toISOString()
        const record: Account = { ...input, id: createId(), userId: store.profile.id, createdAt: now, updatedAt: now }
        store.accounts.push(record)
        return record
      })
    },
    async updateAccount(id, patch) {
      return withStore((store) => {
        const record = store.accounts.find((item) => item.id === id)
        if (!record) throw new AppError('Account not found.', 'not_found')
        Object.assign(record, patch, { updatedAt: new Date().toISOString() })
        return record
      })
    },
    async deleteAccountRecord(id) {
      withStore((store) => {
        if (store.transactions.some((tx) => tx.accountId === id || tx.toAccountId === id)) {
          throw new AppError('This account has transactions. Archive it or move them first.', 'in_use')
        }
        store.accounts = store.accounts.filter((item) => item.id !== id)
      })
    },

    async listCategories() {
      return withStore((store) => [...store.categories].sort((a, b) => a.sortOrder - b.sortOrder))
    },
    async createCategory(input) {
      return withStore((store) => {
        const now = new Date().toISOString()
        const record: Category = {
          ...input,
          id: createId(),
          userId: store.profile.id,
          createdAt: now,
          updatedAt: now,
        }
        store.categories.push(record)
        return record
      })
    },
    async updateCategory(id, patch) {
      return withStore((store) => {
        const record = store.categories.find((item) => item.id === id)
        if (!record) throw new AppError('Category not found.', 'not_found')
        Object.assign(record, patch, { updatedAt: new Date().toISOString() })
        return record
      })
    },
    async deleteCategory(id) {
      withStore((store) => {
        if (store.transactions.some((tx) => tx.categoryId === id || tx.subcategoryId === id)) {
          throw new AppError('This category is used by transactions and cannot be deleted.', 'in_use')
        }
        if (store.categories.some((item) => item.parentId === id)) {
          throw new AppError('Remove subcategories before deleting this category.', 'in_use')
        }
        store.categories = store.categories.filter((item) => item.id !== id)
      })
    },
    async reorderCategories(ids) {
      withStore((store) => {
        ids.forEach((id, index) => {
          const record = store.categories.find((item) => item.id === id)
          if (record) record.sortOrder = index
        })
      })
    },

    async listTransactions() {
      return withStore((store) => {
        generateDueRecurring(store)
        return [...store.transactions]
      })
    },
    async createTransaction(input) {
      return withStore((store) => {
        const now = new Date().toISOString()
        const record: Transaction = {
          ...input,
          id: createId(),
          userId: store.profile.id,
          createdAt: now,
          updatedAt: now,
        }
        store.transactions.unshift(record)
        return record
      })
    },
    async updateTransaction(id, patch) {
      return withStore((store) => {
        const record = store.transactions.find((item) => item.id === id)
        if (!record) throw new AppError('Transaction not found.', 'not_found')
        Object.assign(record, patch, { updatedAt: new Date().toISOString() })
        return record
      })
    },
    async deleteTransaction(id) {
      withStore((store) => {
        store.transactions = store.transactions.filter((item) => item.id !== id)
      })
    },
    async deleteTransactions(ids) {
      withStore((store) => {
        store.transactions = store.transactions.filter((item) => !ids.includes(item.id))
      })
    },
    async updateTransactions(ids, patch) {
      withStore((store) => {
        const now = new Date().toISOString()
        store.transactions.forEach((item) => {
          if (ids.includes(item.id)) Object.assign(item, patch, { updatedAt: now })
        })
      })
    },

    async listBudgets() {
      return withStore((store) => [...store.budgets])
    },
    async createBudget(input) {
      return withStore((store) => {
        const now = new Date().toISOString()
        const record: Budget = { ...input, id: createId(), userId: store.profile.id, createdAt: now, updatedAt: now }
        store.budgets.push(record)
        return record
      })
    },
    async updateBudget(id, patch) {
      return withStore((store) => {
        const record = store.budgets.find((item) => item.id === id)
        if (!record) throw new AppError('Budget not found.', 'not_found')
        Object.assign(record, patch, { updatedAt: new Date().toISOString() })
        return record
      })
    },
    async deleteBudget(id) {
      withStore((store) => {
        store.budgets = store.budgets.filter((item) => item.id !== id)
      })
    },

    async listRecurring() {
      return withStore((store) => [...store.recurring])
    },
    async createRecurring(input) {
      return withStore((store) => {
        const now = new Date().toISOString()
        const record: RecurringTransaction = {
          ...input,
          id: createId(),
          userId: store.profile.id,
          createdAt: now,
          updatedAt: now,
        }
        store.recurring.push(record)
        generateDueRecurring(store)
        return record
      })
    },
    async updateRecurring(id, patch) {
      return withStore((store) => {
        const record = store.recurring.find((item) => item.id === id)
        if (!record) throw new AppError('Recurring transaction not found.', 'not_found')
        Object.assign(record, patch, { updatedAt: new Date().toISOString() })
        return record
      })
    },
    async deleteRecurring(id) {
      withStore((store) => {
        store.recurring = store.recurring.filter((item) => item.id !== id)
      })
    },

    async listGoals() {
      return withStore((store) => [...store.goals])
    },
    async createGoal(input) {
      return withStore((store) => {
        const now = new Date().toISOString()
        const record: Goal = { ...input, id: createId(), userId: store.profile.id, createdAt: now, updatedAt: now }
        store.goals.push(record)
        return record
      })
    },
    async updateGoal(id, patch) {
      return withStore((store) => {
        const record = store.goals.find((item) => item.id === id)
        if (!record) throw new AppError('Goal not found.', 'not_found')
        Object.assign(record, patch, { updatedAt: new Date().toISOString() })
        return record
      })
    },
    async deleteGoal(id) {
      withStore((store) => {
        store.goals = store.goals.filter((item) => item.id !== id)
      })
    },

    async listNotifications() {
      return withStore((store) => [...store.notifications])
    },
    async createNotification(input) {
      return withStore((store) => {
        const record: AppNotification = {
          ...input,
          id: createId(),
          userId: store.profile.id,
          createdAt: new Date().toISOString(),
        }
        store.notifications.unshift(record)
        return record
      })
    },
    async markNotificationRead(id) {
      withStore((store) => {
        const record = store.notifications.find((item) => item.id === id)
        if (record) record.read = true
      })
    },
    async markAllNotificationsRead() {
      withStore((store) => {
        store.notifications.forEach((item) => {
          item.read = true
        })
      })
    },
    async deleteNotification(id) {
      withStore((store) => {
        store.notifications = store.notifications.filter((item) => item.id !== id)
      })
    },

    async listSavedFilters() {
      return withStore((store) => [...store.savedFilters])
    },
    async createSavedFilter(input) {
      return withStore((store) => {
        const record: SavedFilter = {
          ...input,
          id: createId(),
          userId: store.profile.id,
          createdAt: new Date().toISOString(),
        }
        store.savedFilters.push(record)
        return record
      })
    },
    async deleteSavedFilter(id) {
      withStore((store) => {
        store.savedFilters = store.savedFilters.filter((item) => item.id !== id)
      })
    },

    async uploadReceipt(transactionId, file) {
      if (file.size > RECEIPT_MAX_BYTES) throw new AppError('Receipts must be under 8MB.', 'file_too_large')
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
      if (!allowed.includes(file.type)) throw new AppError('Only JPG, PNG, WebP, or PDF receipts are allowed.', 'invalid_type')
      const userId = requireUserId()
      const path = `${userId}/${transactionId}/${file.name}`
      const dataUrl = await fileToDataUrl(file)
      await putAttachment(path, dataUrl)
      await client.updateTransaction(transactionId, { attachmentPath: path, attachmentName: file.name })
      return { path, name: file.name }
    },
    async getReceiptUrl(path) {
      return getAttachment(path)
    },
    async deleteReceipt(path) {
      await deleteAttachment(path)
    },

    async exportAll() {
      return withStore((store) => structuredClone(store))
    },
    async importAll(payload) {
      withStore((store) => {
        const data = payload as Partial<UserStore>
        if (data.accounts) store.accounts = data.accounts
        if (data.categories) store.categories = data.categories
        if (data.transactions) store.transactions = data.transactions
        if (data.budgets) store.budgets = data.budgets
        if (data.recurring) store.recurring = data.recurring
        if (data.goals) store.goals = data.goals
      })
    },
  }

  return client
}
