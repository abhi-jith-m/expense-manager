import { addDays, format, startOfMonth, subDays, subMonths } from 'date-fns'
import { createId } from '@/lib/utils'
import type { Account, Budget, Category, Goal, Transaction } from '@/types'

export function buildSampleData(userId: string, currency: string) {
  const now = new Date()
  const monthStart = startOfMonth(now)
  const accounts: Account[] = [
    {
      id: createId(),
      userId,
      name: 'Everyday checking',
      type: 'bank',
      openingBalance: 2400,
      currency,
      icon: 'Landmark',
      color: '#3B82F6',
      status: 'active',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: createId(),
      userId,
      name: 'Cash',
      type: 'cash',
      openingBalance: 180,
      currency,
      icon: 'Banknote',
      color: '#22D3EE',
      status: 'active',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ]

  const findCategory = (categories: Category[], name: string) =>
    categories.find((item) => item.name === name)?.id ?? null

  const merchants = [
    { merchant: 'Green Market', category: 'Food', amount: 42.5, daysAgo: 1 },
    { merchant: 'City Transit', category: 'Transport', amount: 18.0, daysAgo: 2 },
    { merchant: 'Northwind Cafe', category: 'Food', amount: 14.75, daysAgo: 3 },
    { merchant: 'Streamflix', category: 'Entertainment', amount: 15.99, daysAgo: 4 },
    { merchant: 'Metro Pharmacy', category: 'Health', amount: 28.4, daysAgo: 6 },
    { merchant: 'Aether Apparel', category: 'Shopping', amount: 86.0, daysAgo: 8 },
    { merchant: 'Harbor Utilities', category: 'Bills', amount: 64.2, daysAgo: 10 },
    { merchant: 'Oak Street Rent', category: 'Housing', amount: 1200, daysAgo: 12 },
    { merchant: 'Daily Grind', category: 'Food', amount: 6.5, daysAgo: 13 },
    { merchant: 'Airport Express', category: 'Travel', amount: 48.0, daysAgo: 18 },
  ]

  function transactionsFor(categories: Category[]): Transaction[] {
    const salary = categories.find((item) => item.name === 'Salary')
    const list: Transaction[] = merchants.map((item, index) => ({
      id: createId(),
      userId,
      type: 'expense',
      amount: item.amount,
      currency,
      categoryId: findCategory(categories, item.category),
      subcategoryId: null,
      accountId: accounts[index % 2].id,
      toAccountId: null,
      merchant: item.merchant,
      description: '',
      notes: 'Sample data',
      date: format(subDays(now, item.daysAgo), 'yyyy-MM-dd'),
      paymentMethod: index % 2 === 0 ? 'card' : 'upi',
      tags: ['sample'],
      recurringId: null,
      attachmentPath: null,
      attachmentName: null,
      isSample: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }))

    list.push({
      id: createId(),
      userId,
      type: 'income',
      amount: 4200,
      currency,
      categoryId: salary?.id ?? null,
      subcategoryId: null,
      accountId: accounts[0].id,
      toAccountId: null,
      merchant: 'Northwind Inc.',
      description: 'Monthly salary',
      notes: 'Sample data',
      date: format(addDays(monthStart, 1), 'yyyy-MM-dd'),
      paymentMethod: 'bank_transfer',
      tags: ['sample'],
      recurringId: null,
      attachmentPath: null,
      attachmentName: null,
      isSample: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    })

    list.push({
      id: createId(),
      userId,
      type: 'income',
      amount: 3800,
      currency,
      categoryId: salary?.id ?? null,
      subcategoryId: null,
      accountId: accounts[0].id,
      toAccountId: null,
      merchant: 'Northwind Inc.',
      description: 'Monthly salary',
      notes: 'Sample data',
      date: format(addDays(startOfMonth(subMonths(now, 1)), 1), 'yyyy-MM-dd'),
      paymentMethod: 'bank_transfer',
      tags: ['sample'],
      recurringId: null,
      attachmentPath: null,
      attachmentName: null,
      isSample: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    })

    return list
  }

  const budgets = (categories: Category[]): Budget[] => [
    {
      id: createId(),
      userId,
      name: 'Monthly food',
      categoryId: findCategory(categories, 'Food'),
      limitAmount: 400,
      period: 'monthly',
      startDate: format(monthStart, 'yyyy-MM-dd'),
      endDate: null,
      alertThreshold: 80,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: createId(),
      userId,
      name: 'Overall monthly',
      categoryId: null,
      limitAmount: 2200,
      period: 'monthly',
      startDate: format(monthStart, 'yyyy-MM-dd'),
      endDate: null,
      alertThreshold: 85,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ]

  const goals: Goal[] = [
    {
      id: createId(),
      userId,
      name: 'Emergency fund',
      targetAmount: 6000,
      currentAmount: 1450,
      deadline: format(addDays(now, 180), 'yyyy-MM-dd'),
      icon: 'Shield',
      color: '#A855F7',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ]

  return { accounts, transactionsFor, budgets, goals }
}
