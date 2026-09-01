import { format } from 'date-fns'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { parseDate, toISODate } from '@/lib/dates'
import { parseMoneyInput } from '@/lib/currency'
import type { Category, ImportRowError, MappedImportRow, Transaction, TransactionType } from '@/types'

export const IMPORT_FIELDS = [
  { key: 'date', label: 'Date', required: true },
  { key: 'amount', label: 'Amount', required: true },
  { key: 'type', label: 'Type', required: false },
  { key: 'merchant', label: 'Merchant', required: false },
  { key: 'category', label: 'Category', required: false },
  { key: 'account', label: 'Account', required: false },
  { key: 'description', label: 'Description', required: false },
  { key: 'notes', label: 'Notes', required: false },
  { key: 'paymentMethod', label: 'Payment method', required: false },
  { key: 'tags', label: 'Tags', required: false },
] as const

export type ImportFieldKey = (typeof IMPORT_FIELDS)[number]['key']

export function detectColumns(headers: string[]): Record<ImportFieldKey, string> {
  const mapping = {} as Record<ImportFieldKey, string>
  const normalized = headers.map((header) => header.trim())
  const rules: Array<[ImportFieldKey, string[]]> = [
    ['date', ['date', 'transaction date', 'posted', 'value date']],
    ['amount', ['amount', 'value', 'debit', 'credit', 'sum']],
    ['type', ['type', 'transaction type', 'in/out']],
    ['merchant', ['merchant', 'payee', 'name', 'description']],
    ['category', ['category', 'label']],
    ['account', ['account', 'wallet', 'account name']],
    ['description', ['details', 'memo', 'narration']],
    ['notes', ['notes', 'note', 'comment']],
    ['paymentMethod', ['payment method', 'method', 'mode']],
    ['tags', ['tags', 'labels']],
  ]
  for (const [field, aliases] of rules) {
    const match = normalized.find((header) => aliases.includes(header.toLowerCase()))
    mapping[field] = match ?? ''
  }
  return mapping
}

export function parseTableFile(file: File): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.json')) {
    return file.text().then((text) => {
      const parsed = JSON.parse(text) as unknown
      const rows = Array.isArray(parsed)
        ? parsed
        : ((parsed as { transactions?: unknown[] }).transactions ?? [])
      if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error('JSON must contain an array of transactions.')
      }
      const objects = rows.map((row) => row as Record<string, unknown>)
      const headers = Array.from(new Set(objects.flatMap((row) => Object.keys(row))))
      return {
        headers,
        rows: objects.map((row) =>
          Object.fromEntries(headers.map((header) => [header, String(row[header] ?? '')])),
        ),
      }
    })
  }

  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    return file.arrayBuffer().then((buffer) => {
      const workbook = XLSX.read(buffer, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
      const headers = json.length ? Object.keys(json[0]) : []
      return {
        headers,
        rows: json.map((row) => Object.fromEntries(headers.map((header) => [header, String(row[header] ?? '')]))),
      }
    })
  }

  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.errors.length && !result.data.length) {
          reject(new Error(result.errors[0].message))
          return
        }
        resolve({
          headers: result.meta.fields ?? [],
          rows: result.data,
        })
      },
      error: (error) => reject(error),
    })
  })
}

function inferType(raw: string, amount: number): TransactionType {
  const value = raw.toLowerCase()
  if (value.includes('income') || value.includes('credit') || amount < 0 && value.includes('in')) return 'income'
  if (value.includes('transfer')) return 'transfer'
  if (amount < 0) return 'expense'
  if (value.includes('expense') || value.includes('debit')) return 'expense'
  return amount >= 0 ? 'expense' : 'income'
}

export function mapImportRows(
  rows: Record<string, string>[],
  mapping: Record<ImportFieldKey, string>,
  options: {
    defaultAccountId: string
    defaultCurrency: string
    categories: Category[]
    accountNames: Record<string, string>
  },
): MappedImportRow[] {
  return rows.map((row, index) => {
    const errors: ImportRowError[] = []
    const dateRaw = mapping.date ? row[mapping.date] : ''
    const amountRaw = mapping.amount ? row[mapping.amount] : ''
    const date = parseDate(dateRaw)
    const amount = parseMoneyInput(amountRaw)
    if (!date) errors.push({ row: index + 1, field: 'date', message: 'Invalid date' })
    if (amount === null) errors.push({ row: index + 1, field: 'amount', message: 'Invalid amount' })

    const typeRaw = mapping.type ? row[mapping.type] : ''
    const type = inferType(typeRaw, amount ?? 0)
    const categoryName = mapping.category ? row[mapping.category] : ''
    const category = options.categories.find(
      (item) => item.name.toLowerCase() === categoryName.trim().toLowerCase(),
    )
    const accountName = mapping.account ? row[mapping.account] : ''
    const accountId =
      Object.entries(options.accountNames).find(([, name]) => name.toLowerCase() === accountName.trim().toLowerCase())?.[0] ??
      options.defaultAccountId

    const paymentRaw = (mapping.paymentMethod ? row[mapping.paymentMethod] : 'card').toLowerCase()
    const paymentMethod = (
      ['cash', 'card', 'upi', 'bank_transfer', 'wallet', 'other'] as const
    ).includes(paymentRaw as never)
      ? (paymentRaw as Transaction['paymentMethod'])
      : 'other'

    return {
      row: index + 1,
      errors,
      transaction: {
        type,
        amount: Math.abs(amount ?? 0),
        currency: options.defaultCurrency,
        categoryId: category?.id ?? null,
        subcategoryId: null,
        accountId,
        toAccountId: null,
        merchant: mapping.merchant ? row[mapping.merchant] : '',
        description: mapping.description ? row[mapping.description] : '',
        notes: mapping.notes ? row[mapping.notes] : '',
        date: date ? toISODate(date) : '',
        paymentMethod,
        tags: mapping.tags
          ? row[mapping.tags]
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean)
          : [],
        recurringId: null,
        isSample: false,
      },
    }
  })
}

export function transactionsToCsv(transactions: Transaction[]): string {
  return Papa.unparse(
    transactions.map((tx) => ({
      date: tx.date,
      type: tx.type,
      amount: tx.amount,
      currency: tx.currency,
      merchant: tx.merchant,
      description: tx.description,
      notes: tx.notes,
      payment_method: tx.paymentMethod,
      tags: tx.tags.join(','),
    })),
  )
}

export function transactionsToXlsx(transactions: Transaction[]): Blob {
  const sheet = XLSX.utils.json_to_sheet(
    transactions.map((tx) => ({
      Date: tx.date,
      Type: tx.type,
      Amount: tx.amount,
      Currency: tx.currency,
      Merchant: tx.merchant,
      Description: tx.description,
      Notes: tx.notes,
      PaymentMethod: tx.paymentMethod,
      Tags: tx.tags.join(','),
    })),
  )
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Transactions')
  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

export function exportFilename(kind: string, extension: string): string {
  return `aureum-${kind}-${format(new Date(), 'yyyy-MM-dd')}.${extension}`
}
