import { useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useBudgets, useGoals, useInvalidateFinance, useNotifications, useRecurring, useTransactions } from '@/hooks/use-finance'
import { defaultMonthRange, inRange } from '@/lib/dates'
import { usagePercent } from '@/lib/money'

export function useBudgetAlerts() {
  const { user, client } = useAuth()
  const budgets = useBudgets()
  const transactions = useTransactions()
  const goals = useGoals()
  const recurring = useRecurring()
  const notifications = useNotifications()
  const invalidate = useInvalidateFinance()
  const ran = useRef(false)

  useEffect(() => {
    if (!user || ran.current) return
    if (!budgets.data || !transactions.data || !goals.data || !recurring.data || !notifications.data) return
    ran.current = true
    const profile = user
    const range = defaultMonthRange()
    const existing = new Set(notifications.data.map((item) => `${item.type}:${item.metadata.key ?? ''}`))

    async function emit(type: Parameters<typeof client.createNotification>[0]['type'], title: string, body: string, key: string) {
      if (!profile.notificationPreferences.budgetAlerts && type.startsWith('budget')) return
      if (!profile.notificationPreferences.goalAlerts && type === 'goal_milestone') return
      if (!profile.notificationPreferences.recurringAlerts && type === 'recurring_due') return
      if (existing.has(`${type}:${key}`)) return
      await client.createNotification({ type, title, body, read: false, metadata: { key } })
    }

    void (async () => {
      for (const budget of budgets.data ?? []) {
        const spent = (transactions.data ?? [])
          .filter((tx) => tx.type === 'expense' && inRange(tx.date, range) && (!budget.categoryId || tx.categoryId === budget.categoryId))
          .reduce((sum, tx) => sum + tx.amount, 0)
        const percent = usagePercent(spent, budget.limitAmount)
        if (percent >= 100) {
          await emit('budget_exceeded', 'Budget exceeded', `${budget.name} is over its limit.`, budget.id)
        } else if (percent >= budget.alertThreshold) {
          await emit('budget_near_limit', 'Budget nearing limit', `${budget.name} is at ${percent.toFixed(0)}% of its limit.`, `${budget.id}-near`)
        }
      }
      for (const goal of goals.data ?? []) {
        const percent = usagePercent(goal.currentAmount, goal.targetAmount)
        if (percent >= 100) await emit('goal_milestone', 'Goal reached', `${goal.name} is fully funded.`, goal.id)
        else if (percent >= 50) await emit('goal_milestone', 'Goal halfway', `${goal.name} is 50% complete.`, `${goal.id}-50`)
      }
      const today = new Date().toISOString().slice(0, 10)
      for (const rule of recurring.data ?? []) {
        if (rule.active && rule.nextOccurrence <= today) {
          await emit('recurring_due', 'Recurring due', `${rule.merchant || 'A recurring item'} is due.`, rule.id)
        }
      }
      invalidate()
    })()
  }, [user, budgets.data, transactions.data, goals.data, recurring.data, notifications.data, client, invalidate])
}
