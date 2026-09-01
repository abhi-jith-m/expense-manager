import { format } from 'date-fns'
import { nextOccurrence, toISODate } from '@/lib/dates'
import type { DataClient } from '@/lib/data/client'
import { AppError } from '@/lib/data/errors'
import {
  mapAccount,
  mapBudget,
  mapCategory,
  mapGoal,
  mapNotification,
  mapProfile,
  mapRecurring,
  mapSavedFilter,
  mapTransaction,
  transactionToRow,
} from '@/lib/data/mappers'
import { getSupabase } from '@/lib/supabase'
import { RECEIPT_MAX_BYTES } from '@/lib/utils'
import type { Profile, Session, Transaction } from '@/types'

function unwrap<T>(data: T | null, error: { message: string } | null, fallback: string): T {
  if (error) throw new AppError(error.message)
  if (data === null) throw new AppError(fallback)
  return data
}

async function currentUserId(): Promise<string> {
  const { data, error } = await getSupabase().auth.getUser()
  if (error || !data.user) throw new AppError('Your session expired. Please sign in again.', 'unauthenticated')
  return data.user.id
}

async function loadSession(): Promise<Session | null> {
  const supabase = getSupabase()
  const { data } = await supabase.auth.getSession()
  if (!data.session) return null
  const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', data.session.user.id).single()
  if (error || !profile) return null
  return {
    accessToken: data.session.access_token,
    user: mapProfile(profile, data.session.user.email ?? ''),
  }
}

async function processRecurring(userId: string): Promise<void> {
  const supabase = getSupabase()
  const { data: rules } = await supabase.from('recurring_transactions').select('*').eq('user_id', userId).eq('active', true)
  if (!rules?.length) return
  const today = toISODate(new Date())
  for (const raw of rules) {
    const rule = mapRecurring(raw)
    let next = rule.nextOccurrence
    let active = rule.active
    let guard = 0
    while (next <= today && active && guard < 36) {
      const { data: existing } = await supabase
        .from('transactions')
        .select('id')
        .eq('recurring_id', rule.id)
        .eq('date', next)
        .maybeSingle()
      if (!existing) {
        await supabase.from('transactions').insert(
          transactionToRow(
            {
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
              date: next,
              paymentMethod: rule.paymentMethod,
              tags: ['recurring'],
              recurringId: rule.id,
              attachmentPath: null,
              attachmentName: null,
              isSample: false,
            },
            userId,
          ),
        )
      }
      next = format(nextOccurrence(new Date(next), rule.frequency, rule.interval), 'yyyy-MM-dd')
      if (rule.endDate && next > rule.endDate) active = false
      guard += 1
    }
    await supabase
      .from('recurring_transactions')
      .update({ next_occurrence: next, active })
      .eq('id', rule.id)
  }
}

export function createSupabaseClient(): DataClient {
  const supabase = getSupabase()

  return {
    backend: 'supabase',

    async getSession() {
      const session = await loadSession()
      if (session) await processRecurring(session.user.id)
      return session
    },

    onAuthChange(listener) {
      const { data } = supabase.auth.onAuthStateChange(() => {
        void loadSession().then(listener)
      })
      return () => data.subscription.unsubscribe()
    },

    async signUp(email, password, fullName) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })
      if (error) throw new AppError(error.message)
      if (!data.session) {
        throw new AppError('Check your email to verify your account before signing in.', 'verify_email')
      }
      const session = await loadSession()
      if (!session) throw new AppError('Could not create a session. Try signing in.')
      return session
    },

    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw new AppError(error.message)
      const session = await loadSession()
      if (!session) throw new AppError('Could not load your profile.')
      await processRecurring(session.user.id)
      return session
    },

    async signInWithGoogle() {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/` },
      })
      if (error) throw new AppError(error.message)
    },

    async signOut() {
      const { error } = await supabase.auth.signOut()
      if (error) throw new AppError(error.message)
    },

    async requestPasswordReset(email) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw new AppError(error.message)
    },

    async updatePassword(password) {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw new AppError(error.message)
    },

    async updateProfile(patch) {
      const userId = await currentUserId()
      const payload: Record<string, unknown> = {
        full_name: patch.fullName,
        avatar_url: patch.avatarUrl,
        currency: patch.currency,
        date_format: patch.dateFormat,
        theme: patch.theme,
        onboarding_completed: patch.onboardingCompleted,
        notification_preferences: patch.notificationPreferences,
        updated_at: new Date().toISOString(),
      }
      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined) delete payload[key]
      })
      const { data, error } = await supabase.from('profiles').update(payload).eq('id', userId).select('*').single()
      const { data: auth } = await supabase.auth.getUser()
      return mapProfile(unwrap(data, error, 'Could not update profile.'), auth.user?.email ?? '')
    },

    async uploadAvatar(file) {
      if (file.size > RECEIPT_MAX_BYTES) throw new AppError('Avatar must be under 8MB.')
      const userId = await currentUserId()
      const path = `${userId}/avatar-${Date.now()}-${file.name}`
      const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      if (error) throw new AppError(error.message)
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      await this.updateProfile({ avatarUrl: data.publicUrl })
      return data.publicUrl
    },

    async deleteAccount() {
      const userId = await currentUserId()
      const { error } = await supabase.rpc('delete_own_account')
      if (error) throw new AppError(error.message || 'Could not delete account.')
      await supabase.from('profiles').delete().eq('id', userId)
      await supabase.auth.signOut()
    },

    async listAccounts() {
      const { data, error } = await supabase.from('accounts').select('*').order('created_at')
      return unwrap(data, error, 'Could not load accounts.').map(mapAccount)
    },
    async createAccount(input) {
      const userId = await currentUserId()
      const { data, error } = await supabase
        .from('accounts')
        .insert({
          user_id: userId,
          name: input.name,
          type: input.type,
          opening_balance: input.openingBalance,
          currency: input.currency,
          icon: input.icon,
          color: input.color,
          status: input.status,
        })
        .select('*')
        .single()
      return mapAccount(unwrap(data, error, 'Could not create account.'))
    },
    async updateAccount(id, patch) {
      const { data, error } = await supabase
        .from('accounts')
        .update({
          name: patch.name,
          type: patch.type,
          opening_balance: patch.openingBalance,
          currency: patch.currency,
          icon: patch.icon,
          color: patch.color,
          status: patch.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single()
      return mapAccount(unwrap(data, error, 'Could not update account.'))
    },
    async deleteAccountRecord(id) {
      const { count } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .or(`account_id.eq.${id},to_account_id.eq.${id}`)
      if ((count ?? 0) > 0) {
        throw new AppError('This account has transactions. Archive it or move them first.', 'in_use')
      }
      const { error } = await supabase.from('accounts').delete().eq('id', id)
      if (error) throw new AppError(error.message)
    },

    async listCategories() {
      const { data, error } = await supabase.from('categories').select('*').order('sort_order')
      return unwrap(data, error, 'Could not load categories.').map(mapCategory)
    },
    async createCategory(input) {
      const userId = await currentUserId()
      const { data, error } = await supabase
        .from('categories')
        .insert({
          user_id: userId,
          name: input.name,
          kind: input.kind,
          icon: input.icon,
          color: input.color,
          parent_id: input.parentId,
          sort_order: input.sortOrder,
          is_system: input.isSystem,
        })
        .select('*')
        .single()
      return mapCategory(unwrap(data, error, 'Could not create category.'))
    },
    async updateCategory(id, patch) {
      const { data, error } = await supabase
        .from('categories')
        .update({
          name: patch.name,
          kind: patch.kind,
          icon: patch.icon,
          color: patch.color,
          parent_id: patch.parentId,
          sort_order: patch.sortOrder,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single()
      return mapCategory(unwrap(data, error, 'Could not update category.'))
    },
    async deleteCategory(id) {
      const { count } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .or(`category_id.eq.${id},subcategory_id.eq.${id}`)
      if ((count ?? 0) > 0) {
        throw new AppError('This category is used by transactions and cannot be deleted.', 'in_use')
      }
      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (error) throw new AppError(error.message)
    },
    async reorderCategories(ids) {
      await Promise.all(
        ids.map((id, index) => supabase.from('categories').update({ sort_order: index }).eq('id', id)),
      )
    },

    async listTransactions() {
      const userId = await currentUserId()
      await processRecurring(userId)
      const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false })
      return unwrap(data, error, 'Could not load transactions.').map(mapTransaction)
    },
    async createTransaction(input) {
      const userId = await currentUserId()
      const { data, error } = await supabase
        .from('transactions')
        .insert(transactionToRow(input, userId))
        .select('*')
        .single()
      return mapTransaction(unwrap(data, error, 'Could not create transaction.'))
    },
    async updateTransaction(id, patch) {
      const { data, error } = await supabase
        .from('transactions')
        .update({ ...transactionToRow(patch as Transaction), updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*')
        .single()
      return mapTransaction(unwrap(data, error, 'Could not update transaction.'))
    },
    async deleteTransaction(id) {
      const { error } = await supabase.from('transactions').delete().eq('id', id)
      if (error) throw new AppError(error.message)
    },
    async deleteTransactions(ids) {
      const { error } = await supabase.from('transactions').delete().in('id', ids)
      if (error) throw new AppError(error.message)
    },
    async updateTransactions(ids, patch) {
      const { error } = await supabase
        .from('transactions')
        .update({ ...transactionToRow(patch as Transaction), updated_at: new Date().toISOString() })
        .in('id', ids)
      if (error) throw new AppError(error.message)
    },

    async listBudgets() {
      const { data, error } = await supabase.from('budgets').select('*').order('created_at')
      return unwrap(data, error, 'Could not load budgets.').map(mapBudget)
    },
    async createBudget(input) {
      const userId = await currentUserId()
      const { data, error } = await supabase
        .from('budgets')
        .insert({
          user_id: userId,
          name: input.name,
          category_id: input.categoryId,
          limit_amount: input.limitAmount,
          period: input.period,
          start_date: input.startDate,
          end_date: input.endDate,
          alert_threshold: input.alertThreshold,
        })
        .select('*')
        .single()
      return mapBudget(unwrap(data, error, 'Could not create budget.'))
    },
    async updateBudget(id, patch) {
      const { data, error } = await supabase
        .from('budgets')
        .update({
          name: patch.name,
          category_id: patch.categoryId,
          limit_amount: patch.limitAmount,
          period: patch.period,
          start_date: patch.startDate,
          end_date: patch.endDate,
          alert_threshold: patch.alertThreshold,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single()
      return mapBudget(unwrap(data, error, 'Could not update budget.'))
    },
    async deleteBudget(id) {
      const { error } = await supabase.from('budgets').delete().eq('id', id)
      if (error) throw new AppError(error.message)
    },

    async listRecurring() {
      const { data, error } = await supabase.from('recurring_transactions').select('*').order('next_occurrence')
      return unwrap(data, error, 'Could not load recurring transactions.').map(mapRecurring)
    },
    async createRecurring(input) {
      const userId = await currentUserId()
      const { data, error } = await supabase
        .from('recurring_transactions')
        .insert({
          user_id: userId,
          type: input.type,
          amount: input.amount,
          currency: input.currency,
          category_id: input.categoryId,
          account_id: input.accountId,
          merchant: input.merchant,
          notes: input.notes,
          payment_method: input.paymentMethod,
          frequency: input.frequency,
          interval: input.interval,
          start_date: input.startDate,
          end_date: input.endDate,
          next_occurrence: input.nextOccurrence,
          active: input.active,
        })
        .select('*')
        .single()
      await processRecurring(userId)
      return mapRecurring(unwrap(data, error, 'Could not create recurring transaction.'))
    },
    async updateRecurring(id, patch) {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .update({
          type: patch.type,
          amount: patch.amount,
          currency: patch.currency,
          category_id: patch.categoryId,
          account_id: patch.accountId,
          merchant: patch.merchant,
          notes: patch.notes,
          payment_method: patch.paymentMethod,
          frequency: patch.frequency,
          interval: patch.interval,
          start_date: patch.startDate,
          end_date: patch.endDate,
          next_occurrence: patch.nextOccurrence,
          active: patch.active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single()
      return mapRecurring(unwrap(data, error, 'Could not update recurring transaction.'))
    },
    async deleteRecurring(id) {
      const { error } = await supabase.from('recurring_transactions').delete().eq('id', id)
      if (error) throw new AppError(error.message)
    },

    async listGoals() {
      const { data, error } = await supabase.from('goals').select('*').order('created_at')
      return unwrap(data, error, 'Could not load goals.').map(mapGoal)
    },
    async createGoal(input) {
      const userId = await currentUserId()
      const { data, error } = await supabase
        .from('goals')
        .insert({
          user_id: userId,
          name: input.name,
          target_amount: input.targetAmount,
          current_amount: input.currentAmount,
          deadline: input.deadline,
          icon: input.icon,
          color: input.color,
        })
        .select('*')
        .single()
      return mapGoal(unwrap(data, error, 'Could not create goal.'))
    },
    async updateGoal(id, patch) {
      const { data, error } = await supabase
        .from('goals')
        .update({
          name: patch.name,
          target_amount: patch.targetAmount,
          current_amount: patch.currentAmount,
          deadline: patch.deadline,
          icon: patch.icon,
          color: patch.color,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single()
      return mapGoal(unwrap(data, error, 'Could not update goal.'))
    },
    async deleteGoal(id) {
      const { error } = await supabase.from('goals').delete().eq('id', id)
      if (error) throw new AppError(error.message)
    },

    async listNotifications() {
      const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false })
      return unwrap(data, error, 'Could not load notifications.').map(mapNotification)
    },
    async createNotification(input) {
      const userId = await currentUserId()
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: input.type,
          title: input.title,
          body: input.body,
          read: input.read,
          metadata: input.metadata,
        })
        .select('*')
        .single()
      return mapNotification(unwrap(data, error, 'Could not create notification.'))
    },
    async markNotificationRead(id) {
      const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id)
      if (error) throw new AppError(error.message)
    },
    async markAllNotificationsRead() {
      const userId = await currentUserId()
      const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', userId)
      if (error) throw new AppError(error.message)
    },
    async deleteNotification(id) {
      const { error } = await supabase.from('notifications').delete().eq('id', id)
      if (error) throw new AppError(error.message)
    },

    async listSavedFilters() {
      const { data, error } = await supabase.from('saved_filters').select('*').order('created_at')
      return unwrap(data, error, 'Could not load saved filters.').map(mapSavedFilter)
    },
    async createSavedFilter(input) {
      const userId = await currentUserId()
      const { data, error } = await supabase
        .from('saved_filters')
        .insert({ user_id: userId, name: input.name, filters: input.filters })
        .select('*')
        .single()
      return mapSavedFilter(unwrap(data, error, 'Could not save filter.'))
    },
    async deleteSavedFilter(id) {
      const { error } = await supabase.from('saved_filters').delete().eq('id', id)
      if (error) throw new AppError(error.message)
    },

    async uploadReceipt(transactionId, file) {
      if (file.size > RECEIPT_MAX_BYTES) throw new AppError('Receipts must be under 8MB.')
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
      if (!allowed.includes(file.type)) throw new AppError('Only JPG, PNG, WebP, or PDF receipts are allowed.')
      const userId = await currentUserId()
      const path = `${userId}/${transactionId}/${file.name}`
      const { error } = await supabase.storage.from('receipts').upload(path, file, { upsert: true })
      if (error) throw new AppError(error.message)
      await this.updateTransaction(transactionId, { attachmentPath: path, attachmentName: file.name })
      return { path, name: file.name }
    },
    async getReceiptUrl(path) {
      const { data, error } = await supabase.storage.from('receipts').createSignedUrl(path, 60 * 10)
      if (error) throw new AppError(error.message)
      return data.signedUrl
    },
    async deleteReceipt(path) {
      const { error } = await supabase.storage.from('receipts').remove([path])
      if (error) throw new AppError(error.message)
    },

    async exportAll() {
      const [accounts, categories, transactions, budgets, recurring, goals] = await Promise.all([
        this.listAccounts(),
        this.listCategories(),
        this.listTransactions(),
        this.listBudgets(),
        this.listRecurring(),
        this.listGoals(),
      ])
      return { accounts, categories, transactions, budgets, recurring, goals }
    },
    async importAll() {
      throw new AppError('Bulk workspace import is available from the Import page.')
    },
  }
}

export type { Profile }
