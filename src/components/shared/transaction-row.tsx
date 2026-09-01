import { CategoryIcon } from '@/components/shared/category-icon'
import { CurrencyDisplay } from '@/components/shared/currency-display'
import { cn } from '@/lib/utils'

export function TransactionRow({
  merchant,
  meta,
  amount,
  currency,
  tone,
  icon,
  color,
  onClick,
  flush,
  className,
}: {
  merchant: string
  meta: string
  amount: number
  currency: string
  tone?: 'income' | 'expense' | 'transfer' | 'neutral'
  icon?: string
  color?: string
  onClick?: () => void
  flush?: boolean
  className?: string
}) {
  const classes = cn(
    'flex w-full min-w-0 items-center gap-3 text-left',
    flush ? 'rounded-none border-0 bg-transparent px-0 py-2' : 'rounded-xl border border-border bg-card px-3 py-2.5',
    className,
  )
  const body = (
    <>
      <CategoryIcon name={icon ?? 'CircleEllipsis'} color={color} size="sm" className="shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{merchant}</p>
        <p className="truncate text-xs text-muted-foreground">{meta}</p>
      </div>
      <CurrencyDisplay amount={amount} currency={currency} tone={tone} className="text-sm font-medium" />
    </>
  )
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes}>
        {body}
      </button>
    )
  }
  return <div className={classes}>{body}</div>
}
