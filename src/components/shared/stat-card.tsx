import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { CurrencyDisplay } from '@/components/shared/currency-display'
import { cn } from '@/lib/utils'

export function StatCard({
  label,
  value,
  currency,
  change,
  comparison,
  formatted,
  compact,
  invertTrend,
}: {
  label: string
  value: number
  currency: string
  change?: number | null
  comparison?: string
  formatted?: string
  compact?: boolean
  invertTrend?: boolean
}) {
  const rising = change !== null && change !== undefined && change > 0
  const falling = change !== null && change !== undefined && change < 0
  const positive = invertTrend ? falling : rising
  const negative = invertTrend ? rising : falling
  const Trend = !change ? Minus : rising ? ArrowUpRight : ArrowDownRight

  return (
    <Card className={cn('min-w-0 transition-colors duration-200', compact && 'bg-card')}>
      <CardContent className={cn(compact ? 'space-y-1 px-3 py-2.5' : 'space-y-3')}>
        <p className="text-label">{label}</p>
        {formatted ? (
          <p className={cn('money tracking-tight text-foreground', compact ? 'text-xl font-semibold' : 'text-kpi')}>
            {formatted}
          </p>
        ) : (
          <CurrencyDisplay
            amount={value}
            currency={currency}
            className={cn('block tracking-tight text-foreground', compact ? 'text-xl font-semibold' : 'text-kpi')}
          />
        )}
        {change !== undefined ? (
          <p
            className={cn(
              'flex items-center gap-1 truncate text-ui-xs',
              positive && 'text-income',
              negative && 'text-expense',
              !positive && !negative && 'text-muted-foreground',
            )}
          >
            <Trend className="size-4 shrink-0" />
            <span className="money truncate">
              {change === null ? 'No prior period' : `${Math.abs(change).toFixed(1)}% ${comparison ?? ''}`}
            </span>
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
