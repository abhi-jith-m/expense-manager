import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts'
import { Plus } from 'lucide-react'
import { format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns'
import { useAuth } from '@/contexts/auth-context'
import { useAccounts, useBudgets, useCategories, useGoals, useTransactions } from '@/hooks/use-finance'
import { DateRangePicker } from '@/components/shared/date-range-picker'
import { StatCard } from '@/components/shared/stat-card'
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
import { defaultMonthRange, daysInRange, elapsedDays, previousRange } from '@/lib/dates'
import { formatMoney } from '@/lib/currency'
import { DashboardInsights } from '@/components/insights/dashboard-insights'
import { VioDashboardInvite } from '@/components/vio/VioDashboardInvite'
import { ChartTooltipContent } from '@/components/shared/chart-tooltip'
import { CHART } from '@/lib/palette'
import type { DateRange } from '@/types'

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
  const budgetSpent = totals.expenses
  const budgetRemaining = overallBudget ? remaining(overallBudget.limitAmount, budgetSpent) : 0

  const trendData = useMemo(() => {
    const days = daysInRange(range)
    const points =
      days <= 31
        ? eachDayOfInterval({ start: range.from, end: range.to })
        : days <= 120
          ? eachWeekOfInterval({ start: range.from, end: range.to }, { weekStartsOn: 1 })
          : eachMonthOfInterval({ start: range.from, end: range.to })
    return points.map((point) => {
      const label = days <= 31 ? format(point, 'MMM d') : days <= 120 ? format(point, 'MMM d') : format(point, 'MMM')
      const slice = current.filter((tx) => {
        if (days <= 31) return tx.date === format(point, 'yyyy-MM-dd')
        return true
      })
      const scoped =
        days <= 31
          ? slice
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

  if (loading) {
    return (
      <div className="page-stack">
        <Skeleton className="h-16" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="h-40" />
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

  return (
    <div className="page-stack">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Welcome back</p>
          <h1 className="truncate text-2xl font-medium tracking-tight">{firstName}</h1>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <div className="col-span-2 sm:col-span-1">
            <DateRangePicker value={range} onChange={setRange} fullWidth />
          </div>
          <Button onClick={() => navigate('/expenses')}>
            <Plus className="size-4" />
            Expense
          </Button>
          <Button variant="outline" onClick={() => navigate('/income')}>
            Income
          </Button>
        </div>
      </div>

      <DashboardInsights range={range} />

      {transactions.length === 0 ? (
        <div className="flex flex-col gap-3 rounded-xl border border-dashed border-border bg-card px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground">No activity yet. Add an expense or import a statement.</p>
          <Button variant="outline" onClick={() => navigate('/import-export')}>
            Import
          </Button>
        </div>
      ) : null}

      <StatCard
        label="Total balance"
        value={balance}
        currency={currency}
        comparison="across accounts"
      />

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          compact
          label="Income"
          value={totals.income}
          currency={currency}
          change={percentChange(totals.income, previousTotals.income)}
          comparison="vs prior"
        />
        <StatCard
          compact
          label="Expenses"
          value={totals.expenses}
          currency={currency}
          invertTrend
          change={percentChange(totals.expenses, previousTotals.expenses)}
          comparison="vs prior"
        />
      </div>

      <StatCard
        compact
        label="Savings"
        value={totals.savings}
        currency={currency}
        change={percentChange(totals.savings, previousTotals.savings)}
        comparison="vs prior"
      />

      <VioDashboardInvite />

      <ChartCard title="Spending trend" compact>
        <ResponsiveChart>
          <AreaChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="label"
              interval="preserveStartEnd"
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              width={36}
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip cursor={{ stroke: 'var(--border)' }} content={<ChartTooltipContent currency={currency} />} />
            <Area type="monotone" dataKey="income" stroke={CHART.income} fill={CHART.income} fillOpacity={0.08} />
            <Area type="monotone" dataKey="expenses" stroke={CHART.expenses} fill={CHART.expenses} fillOpacity={0.14} />
          </AreaChart>
        </ResponsiveChart>
      </ChartCard>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Top categories</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/analytics">See all</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {categoryData.length === 0 ? (
            <p className="text-sm text-muted-foreground">No expenses in range</p>
          ) : (
            categoryData.slice(0, 5).map((item) => (
              <div key={item.id} className="flex min-w-0 items-center gap-3">
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: item.color ?? CHART.other }} />
                <p className="min-w-0 flex-1 truncate text-sm">{item.name}</p>
                <CurrencyDisplay amount={item.value} currency={currency} className="text-sm" />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Budget overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {budgets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No budgets yet.</p>
          ) : (
            budgets.slice(0, 4).map((budget) => {
              const spent = current
                .filter((tx) => tx.type === 'expense' && (!budget.categoryId || tx.categoryId === budget.categoryId))
                .reduce((sum, tx) => sum + tx.amount, 0)
              const percent = usagePercent(spent, budget.limitAmount)
              const projected = (spent / elapsedDays(range)) * daysInRange(range)
              const over = percent >= 100
              const near = !over && percent >= budget.alertThreshold
              return (
                <div key={budget.id} className="space-y-1.5">
                  <div className="flex min-w-0 items-center justify-between gap-3 text-sm">
                    <span className="truncate">{budget.name}</span>
                    <CurrencyDisplay amount={spent} currency={currency} className="text-sm" />
                  </div>
                  <Progress value={percent} tone={over ? 'danger' : near ? 'warning' : 'default'} />
                  <p className="text-xs text-muted-foreground">
                    {percent.toFixed(0)}% · proj. {formatMoney(projected, currency, { compact: true })}
                  </p>
                </div>
              )
            })
          )}
          {overallBudget ? (
            <p className="text-xs text-muted-foreground">
              Budget left <CurrencyDisplay amount={budgetRemaining} currency={currency} className="inline text-xs" />
            </p>
          ) : null}
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Recent transactions</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/transactions">All</Link>
          </Button>
        </div>
        {current.length === 0 ? (
          <p className="text-sm text-muted-foreground">No transactions in this range.</p>
        ) : (
          current.slice(0, 6).map((tx) => {
            const category = tx.categoryId ? categoryMap[tx.categoryId] : undefined
            return (
              <TransactionRow
                key={tx.id}
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
      </section>

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
              <div key={goal.id} className="space-y-1.5">
                <div className="flex justify-between gap-3 text-sm">
                  <span className="truncate">{goal.name}</span>
                  <span>{usagePercent(goal.currentAmount, goal.targetAmount).toFixed(0)}%</span>
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
