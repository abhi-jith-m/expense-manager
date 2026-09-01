import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/auth-context'
import type { CreateTransactionInput } from '@/lib/data/client'
import type {
  Account,
  AppNotification,
  Budget,
  Category,
  Goal,
  RecurringTransaction,
  SavedFilter,
  Transaction,
} from '@/types'

export function useFinanceKeys(userId: string | undefined) {
  return {
    accounts: ['accounts', userId] as const,
    categories: ['categories', userId] as const,
    transactions: ['transactions', userId] as const,
    budgets: ['budgets', userId] as const,
    recurring: ['recurring', userId] as const,
    goals: ['goals', userId] as const,
    notifications: ['notifications', userId] as const,
    savedFilters: ['saved-filters', userId] as const,
    insights: ['insights', userId] as const,
  }
}

export function useAccounts() {
  const { client, user } = useAuth()
  return useQuery({
    queryKey: ['accounts', user?.id],
    queryFn: () => client.listAccounts(),
    enabled: Boolean(user),
  })
}

export function useCategories() {
  const { client, user } = useAuth()
  return useQuery({
    queryKey: ['categories', user?.id],
    queryFn: () => client.listCategories(),
    enabled: Boolean(user),
  })
}

export function useTransactions() {
  const { client, user } = useAuth()
  return useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: () => client.listTransactions(),
    enabled: Boolean(user),
  })
}

export function useBudgets() {
  const { client, user } = useAuth()
  return useQuery({
    queryKey: ['budgets', user?.id],
    queryFn: () => client.listBudgets(),
    enabled: Boolean(user),
  })
}

export function useRecurring() {
  const { client, user } = useAuth()
  return useQuery({
    queryKey: ['recurring', user?.id],
    queryFn: () => client.listRecurring(),
    enabled: Boolean(user),
  })
}

export function useGoals() {
  const { client, user } = useAuth()
  return useQuery({
    queryKey: ['goals', user?.id],
    queryFn: () => client.listGoals(),
    enabled: Boolean(user),
  })
}

export function useNotifications() {
  const { client, user } = useAuth()
  return useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => client.listNotifications(),
    enabled: Boolean(user),
  })
}

export function useSavedFilters() {
  const { client, user } = useAuth()
  return useQuery({
    queryKey: ['saved-filters', user?.id],
    queryFn: () => client.listSavedFilters(),
    enabled: Boolean(user),
  })
}

export function useInvalidateFinance() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const keys = useFinanceKeys(user?.id)
  return () => {
    Object.values(keys).forEach((key) => {
      void queryClient.invalidateQueries({ queryKey: [...key] })
    })
  }
}

export function useCreateTransaction() {
  const { client } = useAuth()
  const invalidate = useInvalidateFinance()
  return useMutation({
    mutationFn: (input: CreateTransactionInput) => client.createTransaction(input),
    onSuccess: invalidate,
  })
}

export function useUpdateTransaction() {
  const { client } = useAuth()
  const invalidate = useInvalidateFinance()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Transaction> }) =>
      client.updateTransaction(id, patch),
    onSuccess: invalidate,
  })
}

export function useDeleteTransactions() {
  const { client } = useAuth()
  const invalidate = useInvalidateFinance()
  return useMutation({
    mutationFn: (ids: string[]) => client.deleteTransactions(ids),
    onSuccess: invalidate,
  })
}

export function useCreateAccount() {
  const { client } = useAuth()
  const invalidate = useInvalidateFinance()
  return useMutation({
    mutationFn: (input: Omit<Account, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) =>
      client.createAccount(input),
    onSuccess: invalidate,
  })
}

export function useCreateCategory() {
  const { client } = useAuth()
  const invalidate = useInvalidateFinance()
  return useMutation({
    mutationFn: (input: Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) =>
      client.createCategory(input),
    onSuccess: invalidate,
  })
}

export function useCreateBudget() {
  const { client } = useAuth()
  const invalidate = useInvalidateFinance()
  return useMutation({
    mutationFn: (input: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) =>
      client.createBudget(input),
    onSuccess: invalidate,
  })
}

export function useCreateRecurring() {
  const { client } = useAuth()
  const invalidate = useInvalidateFinance()
  return useMutation({
    mutationFn: (input: Omit<RecurringTransaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) =>
      client.createRecurring(input),
    onSuccess: invalidate,
  })
}

export function useCreateGoal() {
  const { client } = useAuth()
  const invalidate = useInvalidateFinance()
  return useMutation({
    mutationFn: (input: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) =>
      client.createGoal(input),
    onSuccess: invalidate,
  })
}

export function useCreateNotification() {
  const { client } = useAuth()
  const invalidate = useInvalidateFinance()
  return useMutation({
    mutationFn: (input: Omit<AppNotification, 'id' | 'userId' | 'createdAt'>) =>
      client.createNotification(input),
    onSuccess: invalidate,
  })
}

export function useCreateSavedFilter() {
  const { client } = useAuth()
  const invalidate = useInvalidateFinance()
  return useMutation({
    mutationFn: (input: Omit<SavedFilter, 'id' | 'userId' | 'createdAt'>) =>
      client.createSavedFilter(input),
    onSuccess: invalidate,
  })
}

export function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])
  return debounced
}
