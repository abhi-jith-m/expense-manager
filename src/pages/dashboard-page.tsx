import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts'
import { Plus } from 'lucide-react'
import { format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns'
import { useAuth } from '@/contexts/auth-context'
import { useAccounts, useBudgets, useCategories, useGoals, useTransactions } from '@/hooks/use-finance'
import { DateRangePicker } from '@/components/shared/date-range-picker'
import { ChartCard } from '@/components/shared/chart-card'
import { ResponsiveChart } from '@/components/shared/responsive-chart'
import { TransactionRow } from '@/components/shared/transaction-row'
import { ErrorState } from '@/components/shared/empty-state'
import { CurrencyDisplay } from '@/components/shared/currency-display'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { accountBalance, computeTotals, percentChange, remaining, usagePercent } from '@/lib/money'
import { applyTransactionFilters } from '@/lib/filters'
import { defaultMonthRange, daysInRange, previousRange } from '@/lib/dates'
import { formatMoney } from '@/lib/currency'
import { DashboardInsights } from '@/components/insights/dashboard-insights'
import { ChartTooltipContent } from '@/components/shared/chart-tooltip'
import { CHART, CHART_TICK } from '@/lib/palette'
import { cn } from '@/lib/utils'
import type { DateRange } from '@/types'

function ChangeHint({
  value,
  invert,
}: {
  value: number | null
  invert?: boolean
}) {
  if (value === null) return <span className="text-muted-foreground">—</span>
  const up = value > 0
  const good = invert ? !up : up
  return (
    <span className={cn('money text-ui-xs', good ? 'text-income' : value === 0 ? 'text-muted-foreground' : 'text-expense')}>
      {up ? '+' : ''}
      {value.toFixed(1)}%
    </span>
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [range, setRange] = useState<DateRange>(defaultMonthRange)
  const accountsQuery = useAccounts()
  const categoriesQuery = useCategories()
  const transactionsQuery = useTransactions()
  const budgetsQuery = useBudgets()
  const goalsQuery = useGoals()

  const loading =
    accountsQuery.isLoading || categoriesQuery.isLoading || transactionsQuery.isLoading || budgetsQuery.isLoading
  const failed =
    accountsQuery.isError || categoriesQuery.isError || transactionsQuery.isError || budgetsQuery.isError

  const accounts = accountsQuery.data ?? []
  const categories = categoriesQuery.data ?? []
  const transactions = transactionsQuery.data ?? []
  const budgets = budgetsQuery.data ?? []
  const goals = goalsQuery.data ?? []
  const currency = user?.currency ?? 'USD'
  const categoryMap = Object.fromEntries(categories.map((item) => [item.id, item]))

  const current = useMemo(() => applyTransactionFilters(transactions, {}, range), [transactions, range])
  const previous = useMemo(
    () => applyTransactionFilters(transactions, {}, previousRange(range)),
    [transactions, range],
  )
  const totals = computeTotals(current)
  const previousTotals = computeTotals(previous)
  const balance = accounts.reduce((sum, account) => sum + accountBalance(account, transactions), 0)
  const overallBudget = budgets.find((item) => !item.categoryId)
  const budgetRemaining = overallBudget ? remaining(overallBudget.limitAmount, totals.expenses) : 0

  const trendData = useMemo(() => {
    const days = daysInRange(range)
    const points =
      days <= 31
        ? eachDayOfInterval({ start: range.from, end: range.to })
        : days <= 120
          ? eachWeekOfInterval({ start: range.from, end: range.to }, { weekStartsOn: 1 })
          : eachMonthOfInterval({ start: range.from, end: range.to })
    return points.map((point) => {
      const scoped =
        days <= 31
          ? current.filter((tx) => tx.date === format(point, 'yyyy-MM-dd'))
          : current.filter((tx) => {
              const date = new Date(tx.date)
              if (days <= 120) {
                const end = new Date(point)
                end.setDate(end.getDate() + 6)
                return date >= point && date <= end
              }
              return date.getMonth() === point.getMonth() && date.getFullYear() === point.getFullYear()
            })
      const computed = computeTotals(scoped)
      const label = days <= 31 ? format(point, 'd') : days <= 120 ? format(point, 'MMM d') : format(point, 'MMM')
      return { label, expenses: computed.expenses, income: computed.income, savings: computed.savings }
    })
  }, [current, range])

  const categoryData = useMemo(() => {
    const totalsByCategory: Record<string, number> = {}
    current
      .filter((tx) => tx.type === 'expense' && tx.categoryId)
      .forEach((tx) => {
        totalsByCategory[tx.categoryId!] = (totalsByCategory[tx.categoryId!] ?? 0) + tx.amount
      })
    return Object.entries(totalsByCategory)
      .map(([id, value]) => ({
        id,
        name: categoryMap[id]?.name ?? 'Other',
        value,
        color: categoryMap[id]?.color,
        icon: categoryMap[id]?.icon,
      }))
      .sort((a, b) => b.value - a.value)
  }, [current, categoryMap])

  const spendForCategories = categoryData.reduce((sum, item) => sum + item.value, 0)

  if (loading) {
    return (
      <div className="page-stack">
        <Skeleton className="h-28" />
        <Skeleton className="h-40" />
        <Skeleton className="h-24" />
      </div>
    )
  }

  if (failed) {
    return (
      <ErrorState
        title="Unable to load dashboard"
        description="Something went wrong while loading your financial overview."
        onRetry={() => {
          void accountsQuery.refetch()
          void categoriesQuery.refetch()
          void transactionsQuery.refetch()
          void budgetsQuery.refetch()
        }}
      />
    )
  }

  const firstName = user?.fullName.split(' ')[0] ?? 'there'
  const incomeChange = percentChange(totals.income, previousTotals.income)
  const expenseChange = percentChange(totals.expenses, previousTotals.expenses)
  const savingsChange = percentChange(totals.savings, previousTotals.savings)

  return (
    <div className="page-stack">
      <div className="flex items-center gap-2">
        <h1 className="text-page min-w-0 flex-1 truncate">{firstName}</h1>
        <div className="min-w-0 max-w-[9.5rem] shrink-0 sm:max-w-none">
          <DateRangePicker value={range} onChange={setRange} />
        </div>
        <Button size="icon" aria-label="Add expense" onClick={() => navigate('/expenses')}>
          <Plus className="size-4" />
        </Button>
      </div>

      <DashboardInsights range={range} />

      {transactions.length === 0 ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border px-3 py-2.5 text-sm">
          <p className="min-w-0 truncate text-muted-foreground">No activity yet.</p>
          <Button size="sm" variant="outline" onClick={() => navigate('/import-export')}>
            Import
          </Button>
        </div>
      ) : null}

      <Card>
        <CardContent className="space-y-3">
          <div>
            <p className="text-label">Total balance</p>
            <CurrencyDisplay amount={balance} currency={currency} className="text-kpi mt-0.5 block" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <p className="text-label">Income</p>
              <CurrencyDisplay amount={totals.income} currency={currency} className="block text-base font-semibold" />
              <ChangeHint value={incomeChange} />
            </div>
            <div className="min-w-0">
              <p className="text-label">Expenses</p>
              <CurrencyDisplay amount={totals.expenses} currency={currency} className="block text-base font-semibold" />
              <ChangeHint value={expenseChange} invert />
            </div>
          </div>
          <div className="flex items-end justify-between gap-3 border-t border-border pt-2.5">
            <div className="min-w-0">
              <p className="text-label">Savings</p>
              <CurrencyDisplay amount={totals.savings} currency={currency} className="block text-base font-semibold" />
            </div>
            <ChangeHint value={savingsChange} />
          </div>
        </CardContent>
      </Card>

      <ChartCard title="Spending trend" compact>
        <ResponsiveChart>
          <AreaChart data={trendData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="label"
              interval="preserveStartEnd"
              tick={CHART_TICK}
              axisLine={false}
              tickLine={false}
            />
            <YAxis width={36} tick={CHART_TICK} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ stroke: 'var(--border)' }} content={<ChartTooltipContent currency={currency} />} />
            <Area type="monotone" dataKey="expenses" stroke={CHART.expenses} fill={CHART.expenses} fillOpacity={0.14} />
          </AreaChart>
        </ResponsiveChart>
      </ChartCard>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Categories & budgets</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/budgets">All</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {categoryData.length === 0 ? (
            <p className="text-sm text-muted-foreground">No expenses in range</p>
          ) : (
            categoryData.slice(0, 4).map((item) => {
              const percent = spendForCategories ? (item.value / spendForCategories) * 100 : 0
              return (
                <div key={item.id} className="space-y-1">
                  <div className="flex min-w-0 items-center gap-2 text-sm">
                    <span className="size-2 shrink-0 rounded-full" style={{ background: item.color ?? CHART.other }} />
                    <p className="min-w-0 flex-1 truncate">{item.name}</p>
                    <CurrencyDisplay amount={item.value} currency={currency} className="text-sm" />
                    <span className="money w-8 shrink-0 text-right text-ui-xs text-muted-foreground">{percent.toFixed(0)}%</span>
                  </div>
                  <Progress value={percent} />
                </div>
              )
            })
          )}
          {budgets.length ? (
            <div className="space-y-2 border-t border-border pt-2.5">
              {budgets.slice(0, 3).map((budget) => {
                const spent = current
                  .filter((tx) => tx.type === 'expense' && (!budget.categoryId || tx.categoryId === budget.categoryId))
                  .reduce((sum, tx) => sum + tx.amount, 0)
                const percent = usagePercent(spent, budget.limitAmount)
                const over = percent >= 100
                const near = !over && percent >= budget.alertThreshold
                return (
                  <button
                    key={budget.id}
                    type="button"
                    className="w-full space-y-1 text-left"
                    onClick={() => navigate('/budgets')}
                  >
                    <div className="flex min-w-0 items-center justify-between gap-2 text-sm">
                      <span className="truncate">{budget.name}</span>
                      <span className="money shrink-0 text-ui-xs text-muted-foreground">
                        {formatMoney(spent, currency, { compact: true })} / {formatMoney(budget.limitAmount, currency, { compact: true })}
                      </span>
                    </div>
                    <Progress value={percent} tone={over ? 'danger' : near ? 'warning' : 'default'} />
                  </button>
                )
              })}
              {overallBudget ? (
                <p className="text-ui-xs text-muted-foreground">
                  Left <CurrencyDisplay amount={budgetRemaining} currency={currency} className="inline text-ui-xs" />
                </p>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Recent</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/transactions">View all</Link>
          </Button>
        </CardHeader>
        <CardContent className="divide-y divide-border px-3.5 py-1">
          {current.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">No transactions in this range.</p>
          ) : (
            current.slice(0, 5).map((tx) => {
              const category = tx.categoryId ? categoryMap[tx.categoryId] : undefined
              return (
                <TransactionRow
                  key={tx.id}
                  flush
                  merchant={tx.merchant || tx.description || 'Untitled'}
                  meta={`${category?.name ?? tx.type} · ${tx.date}`}
                  amount={tx.amount}
                  currency={tx.currency}
                  icon={category?.icon}
                  color={category?.color}
                  tone={tx.type === 'income' ? 'income' : tx.type === 'expense' ? 'expense' : 'transfer'}
                  onClick={() => navigate(`/transactions?edit=${tx.id}`)}
                />
              )
            })
          )}
        </CardContent>
      </Card>

      <div className="hidden gap-3 lg:grid lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Accounts</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/accounts">View</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {accounts.slice(0, 4).map((account) => (
              <div key={account.id} className="flex items-center justify-between gap-3 text-sm">
                <p className="truncate">{account.name}</p>
                <CurrencyDisplay amount={accountBalance(account, transactions)} currency={account.currency} />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Goals</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/goals">View</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {goals.slice(0, 3).map((goal) => (
              <div key={goal.id} className="space-y-1">
                <div className="flex justify-between gap-3 text-sm">
                  <span className="truncate">{goal.name}</span>
                  <span className="money">{usagePercent(goal.currentAmount, goal.targetAmount).toFixed(0)}%</span>
                </div>
                <Progress value={usagePercent(goal.currentAmount, goal.targetAmount)} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
