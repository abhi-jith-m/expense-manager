import { format } from 'date-fns'
import { categoryTotals, percentChange, savingsRate, sumBy } from '@/lib/money'
import type { Category, Transaction } from '@/types'

export interface Insight {
  id: string
  text: string
}

export function buildInsights(
  current: Transaction[],
  previous: Transaction[],
  categories: Category[],
): Insight[] {
  const insights: Insight[] = []
  const names = Object.fromEntries(categories.map((item) => [item.id, item.name]))

  const currentExpenses = current.filter((tx) => tx.type === 'expense')
  const previousExpenses = previous.filter((tx) => tx.type === 'expense')
  const currentIncome = sumBy(
    current.filter((tx) => tx.type === 'income'),
    (tx) => tx.amount,
  )
  const currentSpend = sumBy(currentExpenses, (tx) => tx.amount)
  const previousSpend = sumBy(previousExpenses, (tx) => tx.amount)
  const spendChange = percentChange(currentSpend, previousSpend)

  if (spendChange !== null && Math.abs(spendChange) >= 5 && previousSpend > 0) {
    insights.push({
      id: 'spend-change',
      text:
        spendChange > 0
          ? `You spent ${spendChange.toFixed(0)}% more than the previous period.`
          : `You spent ${Math.abs(spendChange).toFixed(0)}% less than the previous period.`,
    })
  }

  const currentByCategory = categoryTotals(currentExpenses)
  const previousByCategory = categoryTotals(previousExpenses)
  let largestLift: { name: string; change: number } | null = null
  for (const [categoryId, amount] of Object.entries(currentByCategory)) {
    const prev = previousByCategory[categoryId] ?? 0
    const change = percentChange(amount, prev)
    if (change === null || prev === 0 || Math.abs(change) < 12) continue
    if (!largestLift || Math.abs(change) > Math.abs(largestLift.change)) {
      largestLift = { name: names[categoryId] ?? 'this category', change }
    }
  }
  if (largestLift) {
    insights.push({
      id: 'category-lift',
      text:
        largestLift.change > 0
          ? `You spent ${largestLift.change.toFixed(0)}% more on ${largestLift.name} this period.`
          : `You spent ${Math.abs(largestLift.change).toFixed(0)}% less on ${largestLift.name} this period.`,
    })
  }

  if (currentExpenses.length > 0) {
    const largest = [...currentExpenses].sort((a, b) => b.amount - a.amount)[0]
    insights.push({
      id: 'largest',
      text: `Largest transaction: ${largest.merchant || 'Untitled'} on ${format(new Date(largest.date), 'MMM d')}.`,
    })
  }

  if (currentIncome > 0) {
    const rate = savingsRate(currentIncome, currentSpend)
    insights.push({
      id: 'savings-rate',
      text: `Your savings rate this period is ${rate.toFixed(0)}%.`,
    })
  }

  const weekdayTotals = new Array<number>(7).fill(0)
  for (const tx of currentExpenses) {
    weekdayTotals[new Date(tx.date).getDay()] += tx.amount
  }
  const peakDay = weekdayTotals.indexOf(Math.max(...weekdayTotals))
  if (currentExpenses.length > 3 && weekdayTotals[peakDay] > 0) {
    const labels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    insights.push({
      id: 'weekday',
      text: `You typically spend the most on ${labels[peakDay]}s.`,
    })
  }

  return insights.slice(0, 5)
}
