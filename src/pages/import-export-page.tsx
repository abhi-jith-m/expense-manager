import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/contexts/auth-context'
import { useAccounts, useCategories, useCreateNotification, useInvalidateFinance, useTransactions } from '@/hooks/use-finance'
import {
  detectColumns,
  exportFilename,
  IMPORT_FIELDS,
  mapImportRows,
  parseTableFile,
  transactionsToCsv,
  transactionsToXlsx,
  type ImportFieldKey,
} from '@/lib/import-export'
import { applyTransactionFilters } from '@/lib/filters'
import { downloadBlob } from '@/lib/utils'
import { toUserMessage } from '@/lib/data/errors'
import type { TransactionFilters } from '@/types'

const steps = ['Upload', 'Map columns', 'Preview', 'Result']

export function ImportExportPage() {
  const { user, client } = useAuth()
  const accounts = useAccounts()
  const categories = useCategories()
  const transactions = useTransactions()
  const notify = useCreateNotification()
  const invalidate = useInvalidateFinance()
  const [step, setStep] = useState(0)
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const [mapping, setMapping] = useState<Record<ImportFieldKey, string>>({} as Record<ImportFieldKey, string>)
  const [exportFilters, setExportFilters] = useState<TransactionFilters>({})
  const [imported, setImported] = useState(0)

  const preview = useMemo(() => {
    if (!rows.length || !accounts.data?.[0]) return []
    return mapImportRows(rows, mapping, {
      defaultAccountId: accounts.data[0].id,
      defaultCurrency: user?.currency ?? 'USD',
      categories: categories.data ?? [],
      accountNames: Object.fromEntries((accounts.data ?? []).map((item) => [item.id, item.name])),
    })
  }, [rows, mapping, accounts.data, categories.data, user?.currency])

  const valid = preview.filter((row) => row.errors.length === 0)
  const invalid = preview.filter((row) => row.errors.length > 0)

  async function onFile(file: File) {
    try {
      const parsed = await parseTableFile(file)
      setHeaders(parsed.headers)
      setRows(parsed.rows)
      setMapping(detectColumns(parsed.headers))
      setStep(1)
    } catch (error) {
      toast.error(toUserMessage(error, 'Could not read that file.'))
    }
  }

  async function confirmImport() {
    try {
      for (const row of valid) {
        await client.createTransaction({
          ...row.transaction,
          attachmentPath: null,
          attachmentName: null,
        })
      }
      setImported(valid.length)
      invalidate()
      await notify.mutateAsync({
        type: 'import_completed',
        title: 'Import complete',
        body: `${valid.length} transactions imported. ${invalid.length} rows skipped.`,
        read: false,
        metadata: {},
      })
      toast.success(`${valid.length} transactions imported`)
      setStep(3)
    } catch (error) {
      toast.error(toUserMessage(error))
    }
  }

  const exportRows = applyTransactionFilters(transactions.data ?? [], exportFilters)

  return (
    <div className="page-stack">
      <PageHeader title="Import / Export" description="Guided CSV, Excel, and JSON import with column mapping and validation." />
      <Card>
        <CardHeader>
          <CardTitle>Import wizard · {steps[step]}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 ? (
            <div className="space-y-3">
              <Label htmlFor="file">Upload CSV, XLSX, or JSON</Label>
              <Input id="file" type="file" accept=".csv,.xlsx,.xls,.json" onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void onFile(file)
              }} />
            </div>
          ) : null}
          {step === 1 ? (
            <div className="grid gap-3">
              {IMPORT_FIELDS.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <Label>{field.label}{field.required ? ' *' : ''}</Label>
                  <Select value={mapping[field.key] || 'none'} onValueChange={(value) => setMapping((current) => ({ ...current, [field.key]: value === 'none' ? '' : value }))}>
                    <SelectTrigger><SelectValue placeholder="Ignore" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Ignore</SelectItem>
                      {headers.map((header) => <SelectItem key={header} value={header}>{header}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              <Button className="w-full" onClick={() => setStep(2)}>Preview</Button>
            </div>
          ) : null}
          {step === 2 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{valid.length} ready · {invalid.length} with errors</p>
              <div className="space-y-2 md:hidden">
                {preview.slice(0, 40).map((row) => (
                  <div key={row.row} className="rounded-xl border border-border px-3 py-3 text-sm">
                    <div className="flex min-w-0 items-center justify-between gap-3">
                      <p className="truncate font-medium">{row.transaction.merchant || `Row ${row.row}`}</p>
                      <span className="money max-w-[46%] shrink-0 text-right">{row.transaction.amount}</span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{row.transaction.date} · {row.errors[0]?.message ?? 'Ready'}</p>
                  </div>
                ))}
              </div>
              <div className="hidden max-h-72 overflow-x-auto rounded-lg border border-border md:block">
                <table className="w-full min-w-[520px] text-sm">
                  <thead><tr className="bg-muted text-left"><th className="p-2">Row</th><th className="p-2">Date</th><th className="p-2">Amount</th><th className="p-2">Merchant</th><th className="p-2">Status</th></tr></thead>
                  <tbody>
                    {preview.slice(0, 40).map((row) => (
                      <tr key={row.row} className="border-t border-border">
                        <td className="p-2">{row.row}</td>
                        <td className="money p-2">{row.transaction.date}</td>
                        <td className="money p-2">{row.transaction.amount}</td>
                        <td className="max-w-[12rem] truncate p-2">{row.transaction.merchant}</td>
                        <td className="p-2">{row.errors[0]?.message ?? 'Ready'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="w-full" onClick={() => setStep(1)}>Back</Button>
                <Button className="w-full" onClick={() => void confirmImport()} disabled={!valid.length}>Import {valid.length}</Button>
              </div>
            </div>
          ) : null}
          {step === 3 ? (
            <div className="space-y-3">
              <p>Imported {imported} transactions. Invalid rows were left out.</p>
              <Button onClick={() => { setStep(0); setRows([]); setImported(0) }}>Import another file</Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Export transactions</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:flex sm:flex-wrap">
          <Select value={exportFilters.type ?? 'all'} onValueChange={(value) => setExportFilters((current) => ({ ...current, type: value as TransactionFilters['type'] }))}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="expense">Expenses</SelectItem>
              <SelectItem value="income">Income</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => downloadBlob(new Blob([transactionsToCsv(exportRows)], { type: 'text/csv' }), exportFilename('transactions', 'csv'))}>CSV</Button>
          <Button variant="outline" onClick={() => downloadBlob(transactionsToXlsx(exportRows), exportFilename('transactions', 'xlsx'))}>Excel</Button>
          <Button variant="outline" onClick={() => downloadBlob(new Blob([JSON.stringify(exportRows, null, 2)], { type: 'application/json' }), exportFilename('transactions', 'json'))}>JSON</Button>
        </CardContent>
      </Card>
    </div>
  )
}
