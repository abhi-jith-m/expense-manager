import { useMemo, useState } from 'react'
import { eachDayOfInterval, format, getDay } from 'date-fns'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PageHeader } from '@/components/shared/page-header'
import { DateRangePicker } from '@/components/shared/date-range-picker'
import { ChartCard } from '@/components/shared/chart-card'
import { CurrencyDisplay } from '@/components/shared/currency-display'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { useAccounts, useCategories, useTransactions } from '@/hooks/use-finance'
import { applyTransactionFilters } from '@/lib/filters'
import { buildInsights } from '@/lib/insights'
import { categoryTotals, computeTotals, sumBy } from '@/lib/money'
import { defaultMonthRange, previousRange } from '@/lib/dates'
import { formatMoney } from '@/lib/currency'
import { ChartTooltipContent } from '@/components/shared/chart-tooltip'
import { CHART } from '@/lib/palette'
import type { DateRange } from '@/types'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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
    return { label: format(day, 'MMM d'), ...computed }
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
  const topCategoryId = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]?.[0]
  const days = Math.max(1, trend.length)

  return (
    <div className="space-y-5">
      <PageHeader title="Analytics" description="Insights are generated only from your transactions in the selected range." actions={<DateRangePicker value={range} onChange={setRange} />} />
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent><p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Avg daily spend</p><CurrencyDisplay amount={totals.expenses / days} currency={currency} className="text-xl font-semibold tracking-tight" /></CardContent></Card>
        <Card><CardContent><p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Largest transaction</p><p className="text-xl font-semibold tracking-tight tabular">{largest ? formatMoney(largest.amount, currency) : '—'}</p></CardContent></Card>
        <Card><CardContent><p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Highest category</p><p className="text-xl font-semibold tracking-tight">{topCategoryId ? categoryMap[topCategoryId] : '—'}</p></CardContent></Card>
        <Card><CardContent><p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Savings rate</p><p className="text-xl font-semibold tracking-tight tabular">{totals.savingsRate.toFixed(0)}%</p></CardContent></Card>
      </div>
      {insights.length ? (
        <div className="grid gap-2">
          {insights.map((item) => (
            <p key={item.id} className="rounded-xl border border-border bg-card px-4 py-3 text-sm">{item.text}</p>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Add more history to unlock comparison insights.</p>
      )}
      <ChartCard title="Spending and income trend">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ stroke: 'var(--border)' }} content={<ChartTooltipContent currency={currency} />} />
              <Area dataKey="expenses" stroke={CHART.expenses} fill={CHART.expenses} fillOpacity={0.1} />
              <Area dataKey="income" stroke={CHART.income} fill={CHART.income} fillOpacity={0.08} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Weekday spending">
          <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={weekday}><XAxis dataKey="label" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip content={<ChartTooltipContent currency={currency} />} /><Bar dataKey="value" fill={CHART.info} radius={6} /></BarChart></ResponsiveContainer></div>
        </ChartCard>
        <ChartCard title="Merchant analysis">
          <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={merchants} layout="vertical"><XAxis type="number" hide /><YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} /><Tooltip content={<ChartTooltipContent currency={currency} />} /><Bar dataKey="value" fill={CHART.entertainment} radius={6} /></BarChart></ResponsiveContainer></div>
        </ChartCard>
        <ChartCard title="Payment methods">
          <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={methods}><XAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip content={<ChartTooltipContent currency={currency} />} /><Bar dataKey="value" fill={CHART.investments} radius={6} /></BarChart></ResponsiveContainer></div>
        </ChartCard>
        <ChartCard title="Account spending">
          <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={accountSpend}><XAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip content={<ChartTooltipContent currency={currency} />} /><Bar dataKey="value" fill={CHART.expenses} radius={6} /></BarChart></ResponsiveContainer></div>
        </ChartCard>
      </div>
    </div>
  )
}
