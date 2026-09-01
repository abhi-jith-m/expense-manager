import { describe, expect, it } from 'vitest'
import { authSchema, transactionSchema, transferSchema } from '@/schemas'

describe('form validation', () => {
  it('rejects invalid auth', () => {
    expect(authSchema.safeParse({ email: 'nope', password: '123' }).success).toBe(false)
    expect(authSchema.safeParse({ email: 'a@b.com', password: 'password1' }).success).toBe(true)
  })

  it('requires a positive amount', () => {
    const result = transactionSchema.safeParse({
      type: 'expense',
      amount: 0,
      currency: 'USD',
      accountId: 'a',
      date: '2026-08-01',
      paymentMethod: 'card',
    })
    expect(result.success).toBe(false)
  })

  it('requires a different destination account for transfers', () => {
    const result = transferSchema.safeParse({
      type: 'transfer',
      amount: 10,
      currency: 'USD',
      accountId: 'a',
      toAccountId: 'a',
      date: '2026-08-01',
      paymentMethod: 'card',
    })
    expect(result.success).toBe(false)
  })
})
