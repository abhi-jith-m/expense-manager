import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Download } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { DateRangePicker } from '@/components/shared/date-range-picker'
import { CurrencyDisplay } from '@/components/shared/currency-display'
import { MobileSheet } from '@/components/shared/mobile-sheet'
import { StatCard } from '@/components/shared/stat-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/contexts/auth-context'
import { useAccounts, useBudgets, useCategories, useCreateNotification, useTransactions } from '@/hooks/use-finance'
import { applyTransactionFilters } from '@/lib/filters'
import { categoryTotals, computeTotals } from '@/lib/money'
import { defaultMonthRange, formatDate } from '@/lib/dates'
import { downloadBlob } from '@/lib/utils'
import { exportFilename, transactionsToCsv, transactionsToXlsx } from '@/lib/import-export'
import type { DateRange, TransactionType } from '@/types'

export function ReportsPage() {
  const { user } = useAuth()
  const [range, setRange] = useState<DateRange>(defaultMonthRange)
  const [kind, setKind] = useState('monthly')
  const [type, setType] = useState<TransactionType | 'all'>('all')
  const [exportOpen, setExportOpen] = useState(false)
  const transactions = useTransactions()
  const categories = useCategories()
  const accounts = useAccounts()
  const budgets = useBudgets()
  const notify = useCreateNotification()
  const filtered = useMemo(
    () => applyTransactionFilters(transactions.data ?? [], { type }, range),
    [transactions.data, type, range],
  )
  const totals = computeTotals(filtered)
  const byCategory = categoryTotals(filtered)
  const categoryMap = Object.fromEntries((categories.data ?? []).map((item) => [item.id, item.name]))

  function exportJson() {
    downloadBlob(new Blob([JSON.stringify({ range, totals, transactions: filtered }, null, 2)], { type: 'application/json' }), exportFilename('report', 'json'))
    void notify.mutateAsync({ type: 'export_completed', title: 'Export ready', body: 'JSON report downloaded.', read: false, metadata: {} })
    toast.success('JSON exported')
  }

  function exportCsv() {
    downloadBlob(new Blob([transactionsToCsv(filtered)], { type: 'text/csv' }), exportFilename('report', 'csv'))
    toast.success('CSV exported')
  }

  function exportXlsx() {
    downloadBlob(transactionsToXlsx(filtered), exportFilename('report', 'xlsx'))
    toast.success('Excel exported')
  }

  function exportPdf() {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('Aureum financial report', 14, 18)
    doc.setFontSize(10)
    doc.text(`${kind} · ${formatDate(range.from)} – ${formatDate(range.to)}`, 14, 26)
    doc.text(`Income ${totals.income.toFixed(2)}  Expenses ${totals.expenses.toFixed(2)}  Savings ${totals.savings.toFixed(2)}`, 14, 34)
    autoTable(doc, {
      startY: 42,
      head: [['Date', 'Type', 'Merchant', 'Amount']],
      body: filtered.slice(0, 40).map((tx) => [tx.date, tx.type, tx.merchant, String(tx.amount)]),
    })
    doc.save(exportFilename('report', 'pdf'))
    toast.success('PDF exported')
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Reports"
        description="Generate summaries from live data, then export PDF, CSV, Excel, or JSON."
        actions={
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => setExportOpen(true)}>
            <Download className="size-4" />
            Export
          </Button>
        }
      />
      <DateRangePicker value={range} onChange={setRange} fullWidth />
      <div className="grid gap-3">
        <Select value={kind} onValueChange={setKind}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Monthly expense report</SelectItem>
            <SelectItem value="income">Income report</SelectItem>
            <SelectItem value="category">Category report</SelectItem>
            <SelectItem value="yearly">Yearly summary</SelectItem>
            <SelectItem value="account">Account report</SelectItem>
            <SelectItem value="budget">Budget report</SelectItem>
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={(value) => setType(value as typeof type)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="expense">Expenses</SelectItem>
            <SelectItem value="income">Income</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <StatCard compact label="Income" value={totals.income} currency={user?.currency ?? 'USD'} />
      <div className="grid grid-cols-2 gap-3">
        <StatCard compact label="Expenses" value={totals.expenses} currency={user?.currency ?? 'USD'} />
        <StatCard compact label="Net" value={totals.savings} currency={user?.currency ?? 'USD'} />
      </div>
      <Card>
        <CardHeader><CardTitle>Category totals</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {Object.entries(byCategory).map(([id, amount]) => (
            <div key={id} className="flex min-w-0 items-center justify-between gap-3 text-sm">
              <span className="truncate">{categoryMap[id] ?? 'Uncategorized'}</span>
              <CurrencyDisplay amount={amount} currency={user?.currency ?? 'USD'} />
            </div>
          ))}
        </CardContent>
      </Card>
      {kind === 'account' ? (
        <Card>
          <CardHeader><CardTitle>Accounts</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(accounts.data ?? []).map((account) => (
              <div key={account.id} className="flex justify-between text-sm">
                <span>{account.name}</span>
                <span>{account.type}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
      {kind === 'budget' ? (
        <Card>
          <CardHeader><CardTitle>Budgets</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(budgets.data ?? []).map((budget) => (
              <div key={budget.id} className="flex justify-between text-sm">
                <span>{budget.name}</span>
                <CurrencyDisplay amount={budget.limitAmount} currency={user?.currency ?? 'USD'} />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardHeader><CardTitle>Transactions in range</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {filtered.slice(0, 25).map((tx) => (
            <div key={tx.id} className="flex min-w-0 items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate">{tx.date} · {tx.merchant || tx.type}</span>
              <CurrencyDisplay amount={tx.amount} currency={tx.currency} />
            </div>
          ))}
        </CardContent>
      </Card>
      <MobileSheet open={exportOpen} onOpenChange={setExportOpen} title="Export report">
        <div className="grid gap-2">
          <Button variant="outline" className="w-full" onClick={() => { exportPdf(); setExportOpen(false) }}>PDF</Button>
          <Button variant="outline" className="w-full" onClick={() => { exportCsv(); setExportOpen(false) }}>CSV</Button>
          <Button variant="outline" className="w-full" onClick={() => { exportXlsx(); setExportOpen(false) }}>Excel</Button>
          <Button variant="outline" className="w-full" onClick={() => { exportJson(); setExportOpen(false) }}>JSON</Button>
        </div>
      </MobileSheet>
    </div>
  )
}
