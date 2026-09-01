import { describe, expect, it } from 'vitest'
import { detectColumns, mapImportRows, transactionsToCsv } from '@/lib/import-export'
import type { Category, Transaction } from '@/types'

describe('import parsing', () => {
  it('detects common bank-export headers', () => {
    const mapping = detectColumns(['Transaction Date', 'Amount', 'Payee', 'Category'])
    expect(mapping.date).toBe('Transaction Date')
    expect(mapping.amount).toBe('Amount')
    expect(mapping.merchant).toBe('Payee')
    expect(mapping.category).toBe('Category')
  })

  it('validates rows and maps categories', () => {
    const categories: Category[] = [
      {
        id: 'food',
        userId: 'u',
        name: 'Food',
        kind: 'expense',
        icon: 'UtensilsCrossed',
        color: '#000',
        parentId: null,
        sortOrder: 0,
        isSystem: true,
        createdAt: '',
        updatedAt: '',
      },
    ]
    const rows = mapImportRows(
      [
        { Date: '2026-08-01', Amount: '12.50', Merchant: 'Cafe', Category: 'Food' },
        { Date: 'not-a-date', Amount: 'abc', Merchant: 'X', Category: '' },
      ],
      {
        date: 'Date',
        amount: 'Amount',
        merchant: 'Merchant',
        category: 'Category',
        type: '',
        account: '',
        description: '',
        notes: '',
        paymentMethod: '',
        tags: '',
      },
      {
        defaultAccountId: 'cash',
        defaultCurrency: 'USD',
        categories,
        accountNames: { cash: 'Cash' },
      },
    )
    expect(rows[0].errors).toHaveLength(0)
    expect(rows[0].transaction.categoryId).toBe('food')
    expect(rows[0].transaction.amount).toBe(12.5)
    expect(rows[1].errors.length).toBeGreaterThan(0)
  })

  it('exports csv', () => {
    const csv = transactionsToCsv([
      {
        id: '1',
        userId: 'u',
        type: 'expense',
        amount: 10,
        currency: 'USD',
        categoryId: null,
        subcategoryId: null,
        accountId: 'a',
        toAccountId: null,
        merchant: 'Shop',
        description: '',
        notes: '',
        date: '2026-08-01',
        paymentMethod: 'card',
        tags: ['a'],
        recurringId: null,
        attachmentPath: null,
        attachmentName: null,
        isSample: false,
        createdAt: '',
        updatedAt: '',
      } satisfies Transaction,
    ])
    expect(csv).toContain('Shop')
    expect(csv).toContain('2026-08-01')
  })
})
