import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Bar, BarChart, Tooltip, XAxis, YAxis } from 'recharts'
import { PageHeader } from '@/components/shared/page-header'
import { TransactionForm } from '@/components/shared/transaction-form'
import { CurrencyDisplay } from '@/components/shared/currency-display'
import { ChartCard } from '@/components/shared/chart-card'
import { ResponsiveChart } from '@/components/shared/responsive-chart'
import { TransactionRow } from '@/components/shared/transaction-row'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/contexts/auth-context'
import { useAccounts, useCategories, useCreateTransaction, useTransactions } from '@/hooks/use-finance'
import { computeTotals } from '@/lib/money'
import { ChartTooltipContent } from '@/components/shared/chart-tooltip'
import { toUserMessage } from '@/lib/data/errors'
import { toCreateInput } from '@/lib/transaction-input'

export function IncomePage() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const transactions = useTransactions()
  const accounts = useAccounts()
  const categories = useCategories()
  const createTransaction = useCreateTransaction()
  const income = (transactions.data ?? []).filter((tx) => tx.type === 'income')
  const totals = computeTotals(income)
  const bySource = useMemo(() => {
    const map: Record<string, number> = {}
    income.forEach((tx) => {
      const key = tx.merchant || 'Unspecified'
      map[key] = (map[key] ?? 0) + tx.amount
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [income])

  return (
    <div className="page-stack">
      <PageHeader
        title="Income"
        description="Salary, freelance, and other inflows. Transfers are excluded from these totals."
        actions={<Button className="w-full sm:w-auto" onClick={() => setOpen(true)}><Plus className="size-4" />Add income</Button>}
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Card className="col-span-2 md:col-span-1"><CardContent className="space-y-1 px-3 py-2.5"><p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Total income</p><CurrencyDisplay amount={totals.income} currency={user?.currency ?? 'USD'} className="text-xl font-semibold tracking-tight" /></CardContent></Card>
        <Card><CardContent className="space-y-1 px-3 py-2.5"><p className="text-xs uppercase text-muted-foreground">Sources</p><p className="text-xl font-medium">{bySource.length}</p></CardContent></Card>
        <Card><CardContent className="space-y-1 px-3 py-2.5"><p className="text-xs uppercase text-muted-foreground">Entries</p><p className="text-xl font-medium">{income.length}</p></CardContent></Card>
      </div>
      <ChartCard title="Income by source" compact>
        <ResponsiveChart>
          <BarChart data={bySource} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <YAxis width={36} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltipContent currency={user?.currency ?? 'USD'} />} />
            <Bar dataKey="value" fill="var(--chart-income)" radius={6} />
          </BarChart>
        </ResponsiveChart>
      </ChartCard>
      <div className="space-y-2">
        {income.map((tx) => (
          <TransactionRow
            key={tx.id}
            merchant={tx.merchant || 'Income'}
            meta={tx.date}
            amount={tx.amount}
            currency={tx.currency}
            tone="income"
          />
        ))}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add income</DialogTitle></DialogHeader>
          <TransactionForm
            accounts={accounts.data ?? []}
            categories={categories.data ?? []}
            defaultType="income"
            defaultCurrency={user?.currency ?? 'USD'}
            submitting={createTransaction.isPending}
            onSubmit={async (values) => {
              try {
                await createTransaction.mutateAsync(toCreateInput(values, { type: 'income', toAccountId: null }))
                toast.success('Income saved')
                setOpen(false)
              } catch (error) {
                toast.error(toUserMessage(error))
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
