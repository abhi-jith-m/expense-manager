import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ArrowRight, Plus } from 'lucide-react'
import { format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns'
import { useAuth } from '@/contexts/auth-context'
import { useAccounts, useBudgets, useCategories, useGoals, useTransactions } from '@/hooks/use-finance'
import { DateRangePicker } from '@/components/shared/date-range-picker'
import { StatCard } from '@/components/shared/stat-card'
import { ChartCard } from '@/components/shared/chart-card'
import { ErrorState } from '@/components/shared/empty-state'
import { CurrencyDisplay } from '@/components/shared/currency-display'
import { CategoryIcon } from '@/components/shared/category-icon'
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

const CHART_COLORS = [CHART.food, CHART.transport, CHART.shopping, CHART.bills, CHART.entertainment, CHART.other]

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
      .map(([id, value]) => ({ name: categoryMap[id]?.name ?? 'Other', value, color: categoryMap[id]?.color }))
      .sort((a, b) => b.value - a.value)
  }, [current, categoryMap])

  if (loading) {
    return (
      <div className="grid h-full grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-16" />
        ))}
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
    <div className="flex h-full min-h-0 flex-col gap-2.5 overflow-y-auto lg:overflow-hidden lg:gap-3">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Welcome back</p>
          <h1 className="truncate text-xl font-medium tracking-tight">{firstName}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DateRangePicker value={range} onChange={setRange} />
          <Button size="sm" onClick={() => navigate('/expenses')}>
            <Plus className="size-4" />
            Expense
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate('/income')}>
            Income
          </Button>
        </div>
      </div>

      <DashboardInsights range={range} />

      {transactions.length === 0 ? (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-border bg-card px-3 py-2 text-sm">
          <p className="text-muted-foreground">No activity yet. Add an expense or import a statement.</p>
          <Button size="sm" variant="outline" onClick={() => navigate('/import-export')}>
            Import
          </Button>
        </div>
      ) : null}

      <div className="grid shrink-0 grid-cols-2 gap-2 lg:grid-cols-6">
        <StatCard compact label="Balance" value={balance} currency={currency} />
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
        <StatCard
          compact
          label="Savings"
          value={totals.savings}
          currency={currency}
          change={percentChange(totals.savings, previousTotals.savings)}
          comparison="vs prior"
        />
        <StatCard
          compact
          label="Savings rate"
          value={totals.savingsRate}
          currency={currency}
          formatted={`${totals.savingsRate.toFixed(0)}%`}
        />
        <StatCard compact label="Budget left" value={overallBudget ? budgetRemaining : 0} currency={currency} />
      </div>

      <VioDashboardInvite />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2.5 overflow-hidden lg:grid-cols-12 lg:grid-rows-2 lg:gap-3">
        <ChartCard className="min-h-48 lg:col-span-7 lg:row-span-1 lg:min-h-0" title="Cash flow" compact>
          <div className="h-full min-h-40 lg:min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} width={40} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ stroke: 'var(--border)' }}
                  content={<ChartTooltipContent currency={currency} />}
                />
                <Area type="monotone" dataKey="income" stroke={CHART.income} fill={CHART.income} fillOpacity={0.08} />
                <Area type="monotone" dataKey="expenses" stroke={CHART.expenses} fill={CHART.expenses} fillOpacity={0.14} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard className="min-h-48 lg:col-span-5 lg:row-span-1 lg:min-h-0" title="Spending by category" compact>
          <div className="flex h-full min-h-40 gap-2 lg:min-h-0">
            {categoryData.length ? (
              <>
                <div className="min-w-0 flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={36} outerRadius={58}>
                        {categoryData.map((entry, index) => (
                          <Cell key={entry.name} fill={entry.color ?? CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltipContent currency={currency} />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="hidden w-36 shrink-0 space-y-1 overflow-y-auto self-center xl:block">
                  {categoryData.slice(0, 5).map((item) => (
                    <div key={item.name} className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="truncate text-muted-foreground">{item.name}</span>
                      <span className="tabular">{formatMoney(item.value, currency, { compact: true })}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                No expenses in range
              </p>
            )}
          </div>
        </ChartCard>

        <Card className="flex min-h-40 min-w-0 flex-col overflow-hidden lg:col-span-4 lg:min-h-0">
          <CardHeader className="flex-row items-center justify-between px-3 pt-3">
            <CardTitle className="text-sm">Recent</CardTitle>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" asChild>
              <Link to="/transactions">
                All <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-3 pt-2">
            {current.length === 0 ? (
              <p className="text-xs text-muted-foreground">No transactions in this range.</p>
            ) : (
              current.slice(0, 8).map((tx) => {
                const category = tx.categoryId ? categoryMap[tx.categoryId] : undefined
                return (
                  <button
                    key={tx.id}
                    className="flex w-full items-center gap-2 rounded-md px-1 py-1 text-left hover:bg-muted"
                    onClick={() => navigate(`/transactions?edit=${tx.id}`)}
                  >
                    <CategoryIcon name={category?.icon ?? 'CircleEllipsis'} color={category?.color} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{tx.merchant || tx.description || 'Untitled'}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{tx.date}</p>
                    </div>
                    <CurrencyDisplay
                      amount={tx.amount}
                      currency={tx.currency}
                      className="text-xs"
                      tone={tx.type === 'income' ? 'income' : tx.type === 'expense' ? 'expense' : 'transfer'}
                    />
                  </button>
                )
              })
            )}
          </CardContent>
        </Card>

        <Card className="flex min-h-40 min-w-0 flex-col overflow-hidden lg:col-span-4 lg:min-h-0">
          <CardHeader className="px-3 pt-3">
            <CardTitle className="text-sm">Budgets</CardTitle>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3 pb-3 pt-2">
            {budgets.length === 0 ? (
              <p className="text-xs text-muted-foreground">No budgets yet.</p>
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
                  <div key={budget.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="truncate">{budget.name}</span>
                      <CurrencyDisplay amount={spent} currency={currency} className="text-xs" />
                    </div>
                    <Progress value={percent} tone={over ? 'danger' : near ? 'warning' : 'default'} />
                    <p className="text-[11px] text-muted-foreground">
                      {percent.toFixed(0)}% · proj. {formatMoney(projected, currency, { compact: true })}
                    </p>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        <div className="grid min-h-40 grid-rows-2 gap-2.5 overflow-hidden lg:col-span-4 lg:min-h-0">
          <Card className="flex min-h-0 flex-col overflow-hidden">
            <CardHeader className="flex-row items-center justify-between px-3 pt-3">
              <CardTitle className="text-sm">Accounts</CardTitle>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" asChild>
                <Link to="/accounts">View</Link>
              </Button>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-3 pb-3 pt-1">
              {accounts.length === 0 ? (
                <p className="text-xs text-muted-foreground">No accounts.</p>
              ) : (
                accounts.slice(0, 4).map((account) => (
                  <div key={account.id} className="flex items-center justify-between text-xs">
                    <p className="truncate">{account.name}</p>
                    <CurrencyDisplay amount={accountBalance(account, transactions)} currency={account.currency} className="text-xs" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <Card className="flex min-h-0 flex-col overflow-hidden">
            <CardHeader className="flex-row items-center justify-between px-3 pt-3">
              <CardTitle className="text-sm">Goals</CardTitle>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" asChild>
                <Link to="/goals">View</Link>
              </Button>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 pb-3 pt-1">
              {goals.length === 0 ? (
                <p className="text-xs text-muted-foreground">No goals yet.</p>
              ) : (
                goals.slice(0, 3).map((goal) => (
                  <div key={goal.id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="truncate">{goal.name}</span>
                      <span>{usagePercent(goal.currentAmount, goal.targetAmount).toFixed(0)}%</span>
                    </div>
                    <Progress value={usagePercent(goal.currentAmount, goal.targetAmount)} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
