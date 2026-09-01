import { useMemo, useState } from 'react'
import { eachDayOfInterval, format, getDay } from 'date-fns'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts'
import { PageHeader } from '@/components/shared/page-header'
import { DateRangePicker } from '@/components/shared/date-range-picker'
import { ChartCard } from '@/components/shared/chart-card'
import { ResponsiveChart } from '@/components/shared/responsive-chart'
import { CurrencyDisplay } from '@/components/shared/currency-display'
import { StatCard } from '@/components/shared/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { useAccounts, useCategories, useTransactions } from '@/hooks/use-finance'
import { applyTransactionFilters } from '@/lib/filters'
import { buildInsights } from '@/lib/insights'
import { categoryTotals, computeTotals, sumBy } from '@/lib/money'
import { defaultMonthRange, previousRange } from '@/lib/dates'
import { ChartTooltipContent } from '@/components/shared/chart-tooltip'
import { CHART } from '@/lib/palette'
import type { DateRange } from '@/types'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export function AnalyticsPage() {
  const { user } = useAuth()
  const [range, setRange] = useState<DateRange>(defaultMonthRange)
  const transactions = useTransactions()
  const categories = useCategories()
  const accounts = useAccounts()
  const currency = user?.currency ?? 'USD'
  const current = useMemo(() => applyTransactionFilters(transactions.data ?? [], {}, range), [transactions.data, range])
  const previous = useMemo(() => applyTransactionFilters(transactions.data ?? [], {}, previousRange(range)), [transactions.data, range])
  const totals = computeTotals(current)
  const insights = buildInsights(current, previous, categories.data ?? [])
  const categoryMap = Object.fromEntries((categories.data ?? []).map((item) => [item.id, item.name]))
  const expenses = current.filter((tx) => tx.type === 'expense')

  const trend = eachDayOfInterval({ start: range.from, end: range.to }).map((day) => {
    const key = format(day, 'yyyy-MM-dd')
    const dayTx = current.filter((tx) => tx.date === key)
    const computed = computeTotals(dayTx)
    return { label: format(day, 'd'), ...computed }
  })

  const weekday = WEEKDAYS.map((label, index) => ({
    label,
    value: sumBy(expenses.filter((tx) => getDay(new Date(tx.date)) === index), (tx) => tx.amount),
  }))

  const merchants = Object.entries(
    expenses.reduce<Record<string, number>>((acc, tx) => {
      const key = tx.merchant || 'Unspecified'
      acc[key] = (acc[key] ?? 0) + tx.amount
      return acc
    }, {}),
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  const methods = Object.entries(
    expenses.reduce<Record<string, number>>((acc, tx) => {
      acc[tx.paymentMethod] = (acc[tx.paymentMethod] ?? 0) + tx.amount
      return acc
    }, {}),
  ).map(([name, value]) => ({ name, value }))

  const accountSpend = (accounts.data ?? []).map((account) => ({
    name: account.name,
    value: sumBy(expenses.filter((tx) => tx.accountId === account.id), (tx) => tx.amount),
  }))

  const largest = [...expenses].sort((a, b) => b.amount - a.amount)[0]
  const byCategory = categoryTotals(expenses)
  const rankedCategories = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
  const topCategoryId = rankedCategories[0]?.[0]
  const days = Math.max(1, trend.length)

  return (
    <div className="page-stack">
      <PageHeader title="Analytics" description="Insights are generated only from your transactions in the selected range." />
      <DateRangePicker value={range} onChange={setRange} fullWidth />

      <StatCard compact label="Spending" value={totals.expenses} currency={currency} />
      <div className="grid grid-cols-2 gap-3">
        <StatCard compact label="Avg daily" value={totals.expenses / days} currency={currency} />
        <StatCard
          compact
          label="Savings rate"
          value={totals.savingsRate}
          currency={currency}
          formatted={`${totals.savingsRate.toFixed(0)}%`}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="space-y-1 px-3 py-2.5">
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Largest</p>
            {largest ? (
              <CurrencyDisplay amount={largest.amount} currency={currency} className="text-lg font-semibold" />
            ) : (
              <p className="text-lg font-semibold">—</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 px-3 py-2.5">
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Top category</p>
            <p className="truncate text-lg font-semibold">{topCategoryId ? categoryMap[topCategoryId] : '—'}</p>
          </CardContent>
        </Card>
      </div>

      <ChartCard title="Trend" compact>
        <ResponsiveChart>
          <AreaChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="label" interval="preserveStartEnd" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <YAxis width={36} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ stroke: 'var(--border)' }} content={<ChartTooltipContent currency={currency} />} />
            <Area dataKey="expenses" stroke={CHART.expenses} fill={CHART.expenses} fillOpacity={0.1} />
            <Area dataKey="income" stroke={CHART.income} fill={CHART.income} fillOpacity={0.08} />
          </AreaChart>
        </ResponsiveChart>
      </ChartCard>

      <Card>
        <CardHeader>
          <CardTitle>Top categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {rankedCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">No category spend in this range.</p>
          ) : (
            rankedCategories.map(([id, amount]) => (
              <div key={id} className="flex min-w-0 items-center justify-between gap-3 text-sm">
                <span className="truncate">{categoryMap[id] ?? 'Uncategorized'}</span>
                <CurrencyDisplay amount={amount} currency={currency} />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {insights.length ? (
        <div className="grid gap-2">
          {insights.map((item) => (
            <p key={item.id} className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
              {item.text}
            </p>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Add more history to unlock comparison insights.</p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Weekday spending" compact>
          <ResponsiveChart>
            <BarChart data={weekday} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltipContent currency={currency} />} />
              <Bar dataKey="value" fill={CHART.info} radius={6} />
            </BarChart>
          </ResponsiveChart>
        </ChartCard>
        <ChartCard title="Merchants" compact>
          <ResponsiveChart>
            <BarChart data={merchants} layout="vertical" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={72} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltipContent currency={currency} />} />
              <Bar dataKey="value" fill={CHART.entertainment} radius={6} />
            </BarChart>
          </ResponsiveChart>
        </ChartCard>
        <ChartCard title="Payment methods" compact>
          <ResponsiveChart>
            <BarChart data={methods} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltipContent currency={currency} />} />
              <Bar dataKey="value" fill={CHART.investments} radius={6} />
            </BarChart>
          </ResponsiveChart>
        </ChartCard>
        <ChartCard title="Account spending" compact>
          <ResponsiveChart>
            <BarChart data={accountSpend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltipContent currency={currency} />} />
              <Bar dataKey="value" fill={CHART.expenses} radius={6} />
            </BarChart>
          </ResponsiveChart>
        </ChartCard>
      </div>
    </div>
  )
}
