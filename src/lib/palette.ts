export const CHART_TICK = {
  fontSize: 11,
  fill: 'var(--muted-foreground)',
  fontFamily: 'var(--font-data)',
} as const

export const CHART = {
  income: 'var(--chart-income)',
  expenses: 'var(--chart-expense)',
  savings: 'var(--chart-savings)',
  investments: '#3B82F6',
  bills: '#22D3EE',
  food: '#8B5CF6',
  transport: '#3B82F6',
  shopping: '#EC4899',
  entertainment: '#A855F7',
  health: '#F43F5E',
  travel: '#6366F1',
  other: '#94A3B8',
  info: 'var(--info)',
  warning: 'var(--warning)',
} as const

export const CATEGORY_PALETTE = [
  '#8B5CF6',
  '#A855F7',
  '#6366F1',
  '#3B82F6',
  '#22D3EE',
  '#EC4899',
  '#F43F5E',
  '#F59E0B',
  '#94A3B8',
] as const

export function categoryColor(name: string, fallback?: string): string {
  const map: Record<string, string> = {
    Food: CHART.food,
    Transport: CHART.transport,
    Shopping: CHART.shopping,
    Bills: CHART.bills,
    Entertainment: CHART.entertainment,
    Health: CHART.health,
    Education: CHART.travel,
    Travel: CHART.travel,
    Housing: CHART.entertainment,
    Other: CHART.other,
    Salary: CHART.income,
    Freelance: CHART.savings,
    Business: CHART.investments,
    Investments: CHART.investments,
    Gifts: CHART.shopping,
    'Other income': CHART.other,
  }
  return fallback ?? map[name] ?? CHART.other
}
