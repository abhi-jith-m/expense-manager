import { describe, expect, it } from 'vitest'
import { applyTransactionFilters, searchTransactions, sortTransactions } from '@/lib/filters'
import type { Transaction } from '@/types'

function tx(partial: Partial<Transaction>): Transaction {
  return {
    id: '1',
    userId: 'u',
    type: 'expense',
    amount: 12,
    currency: 'USD',
    categoryId: 'food',
    subcategoryId: null,
    accountId: 'cash',
    toAccountId: null,
    merchant: 'Cafe',
    description: 'Lunch',
    notes: 'with team',
    date: '2026-08-01',
    paymentMethod: 'card',
    tags: ['work'],
    recurringId: null,
    attachmentPath: null,
    attachmentName: null,
    isSample: false,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    ...partial,
  }
}

describe('filters', () => {
  const items = [
    tx({ id: '1', merchant: 'Cafe', amount: 12, type: 'expense' }),
    tx({ id: '2', merchant: 'Salary', amount: 1000, type: 'income', categoryId: 'salary', date: '2026-08-10', notes: '' }),
  ]

  it('filters by type and category', () => {
    expect(applyTransactionFilters(items, { type: 'income' })).toHaveLength(1)
    expect(applyTransactionFilters(items, { categoryId: 'food' })).toHaveLength(1)
  })

  it('searches merchant, notes, tags, and categories', () => {
    const found = searchTransactions(items, 'team', { food: 'Food', salary: 'Salary' })
    expect(found.map((item) => item.id)).toEqual(['1'])
    expect(searchTransactions(items, 'salary', { food: 'Food', salary: 'Salary' })).toHaveLength(1)
  })

  it('sorts by amount', () => {
    const sorted = sortTransactions(items, 'amount', 'desc')
    expect(sorted[0].amount).toBe(1000)
  })
})
