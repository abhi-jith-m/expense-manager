/** All monetary values in the app are major units (e.g. 12.34). Internally we compute in cents. */

export function toCents(amount: number): number {
  if (!Number.isFinite(amount)) return 0
  return Math.round(amount * 100)
}

export function fromCents(cents: number): number {
  return cents / 100
}

export function addAmounts(...amounts: number[]): number {
  return fromCents(amounts.reduce((sum, value) => sum + toCents(value), 0))
}

export function subtractAmount(left: number, right: number): number {
  return fromCents(toCents(left) - toCents(right))
}

export function sumBy<T>(items: T[], pick: (item: T) => number): number {
  return fromCents(items.reduce((sum, item) => sum + toCents(pick(item)), 0))
}

export function percentChange(current: number, previous: number): number | null {
  if (toCents(previous) === 0) {
    return toCents(current) === 0 ? 0 : null
  }
  return ((current - previous) / Math.abs(previous)) * 100
}

export function savingsRate(income: number, expenses: number): number {
  if (toCents(income) === 0) return 0
  return ((income - expenses) / income) * 100
}

export function usagePercent(spent: number, limit: number): number {
  if (toCents(limit) <= 0) return 0
  return (spent / limit) * 100
}

export function remaining(limit: number, spent: number): number {
  return subtractAmount(limit, spent)
}

export function projectedSpend(spent: number, elapsedDays: number, totalDays: number): number {
  if (elapsedDays <= 0) return spent
  return fromCents(Math.round((toCents(spent) / elapsedDays) * totalDays))
}

export function requiredMonthlySavings(
  remainingAmount: number,
  deadline: Date,
  now = new Date(),
): number {
  const months = Math.max(
    1,
    (deadline.getFullYear() - now.getFullYear()) * 12 + (deadline.getMonth() - now.getMonth()),
  )
  return fromCents(Math.ceil(toCents(Math.max(0, remainingAmount)) / months))
}

export interface FinanceTotals {
  income: number
  expenses: number
  transfers: number
  savings: number
  savingsRate: number
}

export function computeTotals(
  transactions: { type: 'expense' | 'income' | 'transfer'; amount: number }[],
): FinanceTotals {
  const income = sumBy(
    transactions.filter((item) => item.type === 'income'),
    (item) => item.amount,
  )
  const expenses = sumBy(
    transactions.filter((item) => item.type === 'expense'),
    (item) => item.amount,
  )
  const transfers = sumBy(
    transactions.filter((item) => item.type === 'transfer'),
    (item) => item.amount,
  )
  const savings = subtractAmount(income, expenses)
  return {
    income,
    expenses,
    transfers,
    savings,
    savingsRate: savingsRate(income, expenses),
  }
}

export function accountBalance(
  account: { id: string; openingBalance: number; type: string },
  transactions: { type: string; amount: number; accountId: string; toAccountId: string | null }[],
): number {
  let cents = toCents(account.openingBalance)
  for (const tx of transactions) {
    if (tx.type === 'transfer') {
      if (tx.accountId === account.id) cents -= toCents(tx.amount)
      if (tx.toAccountId === account.id) cents += toCents(tx.amount)
      continue
    }
    if (tx.accountId !== account.id) continue
    if (tx.type === 'income') cents += toCents(tx.amount)
    if (tx.type === 'expense') {
      cents += account.type === 'credit' ? toCents(tx.amount) : -toCents(tx.amount)
    }
  }
  return fromCents(cents)
}

export function categoryTotals(
  transactions: { categoryId: string | null; amount: number; type: string }[],
): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const tx of transactions) {
    if (tx.type === 'transfer' || !tx.categoryId) continue
    totals[tx.categoryId] = addAmounts(totals[tx.categoryId] ?? 0, tx.amount)
  }
  return totals
}
