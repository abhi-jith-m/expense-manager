import { formatMoney } from '@/lib/currency'
import { cn } from '@/lib/utils'

export function CurrencyDisplay({
  amount,
  currency,
  signed = false,
  tone,
  className,
}: {
  amount: number
  currency: string
  signed?: boolean
  tone?: 'income' | 'expense' | 'transfer' | 'neutral'
  className?: string
}) {
  const resolved = tone ?? (signed ? (amount > 0 ? 'income' : amount < 0 ? 'expense' : 'neutral') : 'neutral')
  return (
    <span
      className={cn(
        'money min-w-0 max-w-full text-right',
        resolved === 'income' && 'text-income',
        resolved === 'expense' && 'text-expense',
        resolved === 'transfer' && 'text-info',
        className,
      )}
    >
      {formatMoney(amount, currency, { sign: signed })}
    </span>
  )
}
