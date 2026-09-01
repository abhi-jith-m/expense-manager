import { describe, expect, it } from 'vitest'
import {
  accountBalance,
  addAmounts,
  categoryTotals,
  computeTotals,
  percentChange,
  projectedSpend,
  remaining,
  requiredMonthlySavings,
  savingsRate,
  toCents,
  usagePercent,
} from '@/lib/money'

describe('money calculations', () => {
  it('avoids floating-point drift when adding', () => {
    expect(addAmounts(0.1, 0.2)).toBe(0.3)
    expect(toCents(10.005)).toBe(1001)
  })

  it('computes totals and ignores transfers as income/expense', () => {
    const totals = computeTotals([
      { type: 'income', amount: 1000 },
      { type: 'expense', amount: 250.5 },
      { type: 'transfer', amount: 100 },
    ])
    expect(totals.income).toBe(1000)
    expect(totals.expenses).toBe(250.5)
    expect(totals.savings).toBe(749.5)
    expect(totals.transfers).toBe(100)
    expect(savingsRate(1000, 250.5)).toBeCloseTo(74.95)
  })

  it('computes budget usage and remaining', () => {
    expect(usagePercent(80, 100)).toBe(80)
    expect(remaining(100, 80)).toBe(20)
    expect(projectedSpend(80, 20, 30)).toBe(120)
  })

  it('handles percent change without prior data', () => {
    expect(percentChange(20, 0)).toBeNull()
    expect(percentChange(0, 0)).toBe(0)
    expect(percentChange(80, 100)).toBe(-20)
  })

  it('computes account balances including transfers', () => {
    const account = { id: 'a', openingBalance: 100, type: 'bank' }
    const balance = accountBalance(account, [
      { type: 'income', amount: 50, accountId: 'a', toAccountId: null },
      { type: 'expense', amount: 20, accountId: 'a', toAccountId: null },
      { type: 'transfer', amount: 10, accountId: 'a', toAccountId: 'b' },
    ])
    expect(balance).toBe(120)
  })

  it('groups category totals', () => {
    expect(
      categoryTotals([
        { categoryId: 'food', amount: 10, type: 'expense' },
        { categoryId: 'food', amount: 5, type: 'expense' },
        { categoryId: 'food', amount: 99, type: 'transfer' },
      ]),
    ).toEqual({ food: 15 })
  })

  it('calculates required monthly savings', () => {
    const now = new Date('2026-01-01')
    expect(requiredMonthlySavings(1200, new Date('2026-07-01'), now)).toBe(200)
  })
})
