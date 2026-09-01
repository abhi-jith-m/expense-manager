import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/auth-context'
import { useAccounts, useBudgets, useCategories, useGoals, useRecurring, useTransactions } from '@/hooks/use-finance'
import { toISODate } from '@/lib/dates'
import {
  analyzeInsights,
  chatInsights,
  sendInsightFeedback,
  type FinanceSnapshotPayload,
} from '@/lib/insights-api'
import type { DateRange } from '@/types'

export function useFinanceSnapshot(): FinanceSnapshotPayload | null {
  const { user } = useAuth()
  const transactions = useTransactions()
  const categories = useCategories()
  const accounts = useAccounts()
  const budgets = useBudgets()
  const goals = useGoals()
  const recurring = useRecurring()
  if (!user) return null
  if (
    !transactions.data ||
    !categories.data ||
    !accounts.data ||
    !budgets.data ||
    !goals.data ||
    !recurring.data
  ) {
    return null
  }
  return {
    currency: user.currency,
    transactions: transactions.data,
    categories: categories.data,
    accounts: accounts.data,
    budgets: budgets.data,
    goals: goals.data,
    recurring: recurring.data,
  }
}

export function useInsights(range: DateRange) {
  const { session, user } = useAuth()
  const snapshot = useFinanceSnapshot()
  return useQuery({
    queryKey: [
      'insights',
      user?.id,
      toISODate(range.from),
      toISODate(range.to),
      snapshot?.transactions.length,
      snapshot?.transactions.at(-1)?.updatedAt,
    ],
    enabled: Boolean(session && user && snapshot),
    queryFn: () =>
      analyzeInsights({
        accessToken: session!.accessToken,
        userId: user!.id,
        startDate: toISODate(range.from),
        endDate: toISODate(range.to),
        snapshot: snapshot!,
      }),
    staleTime: 60_000,
    retry: 1,
  })
}

export function useInsightChat(range: DateRange) {
  const { session, user } = useAuth()
  const snapshot = useFinanceSnapshot()
  return useMutation({
    mutationFn: ({ message, conversationId }: { message: string; conversationId?: string }) =>
      chatInsights({
        accessToken: session!.accessToken,
        userId: user!.id,
        message,
        conversationId,
        startDate: toISODate(range.from),
        endDate: toISODate(range.to),
        snapshot: snapshot!,
      }),
  })
}

export function useInsightFeedback() {
  const { session, user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { insightId: string; feedback: 'helpful' | 'not_helpful' | 'not_relevant' | 'already_know' }) =>
      sendInsightFeedback({
        accessToken: session!.accessToken,
        userId: user!.id,
        ...input,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['insights', user?.id] })
    },
  })
}
