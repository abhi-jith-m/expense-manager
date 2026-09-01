import { inRange } from '@/lib/dates'
import type { DateRange, Transaction, TransactionFilters } from '@/types'

export function applyTransactionFilters(
  transactions: Transaction[],
  filters: TransactionFilters,
  range?: DateRange,
): Transaction[] {
  return transactions.filter((tx) => {
    if (range && !inRange(tx.date, range)) return false
    if (filters.dateFrom && tx.date < filters.dateFrom) return false
    if (filters.dateTo && tx.date > filters.dateTo) return false
    if (filters.type && filters.type !== 'all' && tx.type !== filters.type) return false
    if (filters.categoryId && tx.categoryId !== filters.categoryId && tx.subcategoryId !== filters.categoryId) {
      return false
    }
    if (filters.accountId && tx.accountId !== filters.accountId && tx.toAccountId !== filters.accountId) {
      return false
    }
    if (filters.paymentMethod && tx.paymentMethod !== filters.paymentMethod) return false
    if (filters.tag && !tx.tags.includes(filters.tag)) return false
    if (filters.amountMin !== undefined && tx.amount < filters.amountMin) return false
    if (filters.amountMax !== undefined && tx.amount > filters.amountMax) return false
    if (filters.query) {
      const q = filters.query.trim().toLowerCase()
      const haystack = [tx.merchant, tx.description, tx.notes, ...tx.tags].join(' ').toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })
}

export function searchTransactions(
  transactions: Transaction[],
  query: string,
  categoryNames: Record<string, string>,
): Transaction[] {
  const q = query.trim().toLowerCase()
  if (!q) return transactions
  return transactions.filter((tx) => {
    const category = tx.categoryId ? (categoryNames[tx.categoryId] ?? '') : ''
    const subcategory = tx.subcategoryId ? (categoryNames[tx.subcategoryId] ?? '') : ''
    return [tx.merchant, tx.description, tx.notes, category, subcategory, ...tx.tags]
      .join(' ')
      .toLowerCase()
      .includes(q)
  })
}

export function sortTransactions(
  transactions: Transaction[],
  field: 'date' | 'amount' | 'merchant' | 'createdAt' = 'date',
  direction: 'asc' | 'desc' = 'desc',
): Transaction[] {
  const copy = [...transactions]
  copy.sort((a, b) => {
    const left = a[field]
    const right = b[field]
    if (typeof left === 'number' && typeof right === 'number') {
      return direction === 'asc' ? left - right : right - left
    }
    return direction === 'asc'
      ? String(left).localeCompare(String(right))
      : String(right).localeCompare(String(left))
  })
  return copy
}
