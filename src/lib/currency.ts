export interface CurrencyMeta {
  code: string
  symbol: string
  name: string
  decimals: number
}

export const CURRENCIES: CurrencyMeta[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimals: 2 },
  { code: 'USD', symbol: '$', name: 'US Dollar', decimals: 2 },
  { code: 'EUR', symbol: '€', name: 'Euro', decimals: 2 },
  { code: 'GBP', symbol: '£', name: 'British Pound', decimals: 2 },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', decimals: 2 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', decimals: 2 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', decimals: 2 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', decimals: 2 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimals: 0 },
]

export function getCurrency(code: string): CurrencyMeta {
  return CURRENCIES.find((item) => item.code === code) ?? CURRENCIES[1]
}

export function formatMoney(
  amount: number,
  currencyCode = 'USD',
  options: { sign?: boolean; compact?: boolean } = {},
): string {
  const currency = getCurrency(currencyCode)
  const absolute = Math.abs(amount)
  const formatted = new Intl.NumberFormat(undefined, {
    style: 'decimal',
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals,
    notation: options.compact ? 'compact' : 'standard',
  }).format(absolute)

  const prefix = options.sign ? (amount < 0 ? '−' : amount > 0 ? '+' : '') : amount < 0 ? '−' : ''
  return `${prefix}${currency.symbol}${formatted}`
}

export function parseMoneyInput(value: string): number | null {
  const cleaned = value.replace(/[^\d.-]/g, '')
  if (!cleaned || cleaned === '-' || cleaned === '.') return null
  const parsed = Number(cleaned)
  if (!Number.isFinite(parsed)) return null
  return parsed
}
