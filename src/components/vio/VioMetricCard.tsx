import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { formatMoney } from '@/lib/currency'
import { cn } from '@/lib/utils'
import type { ChatMetric } from '@/lib/insights-api'

export function VioMetricCard({ metric, currency }: { metric: ChatMetric; currency: string }) {
  const rising = (metric.change ?? 0) > 0
  const falling = (metric.change ?? 0) < 0
  const formatted =
    metric.unit === 'percent' ? `${metric.value.toFixed(0)}%` : formatMoney(metric.value, currency)
  return (
    <div className="rounded-xl border border-border bg-[var(--vio-surface)] px-3 py-2">
      <p className="text-label">{metric.label}</p>
      <p className="money mt-1 text-lg font-semibold tracking-tight">{formatted}</p>
      {metric.change != null ? (
        <p className={cn('money mt-0.5 flex items-center gap-1 text-ui-xs', rising && 'text-expense', falling && 'text-income')}>
          {rising ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
          {Math.abs(metric.change).toFixed(1)}%
          {metric.previous != null ? (
            <span className="text-muted-foreground">
              vs {metric.unit === 'percent' ? `${metric.previous.toFixed(0)}%` : formatMoney(metric.previous, currency)}
            </span>
          ) : null}
        </p>
      ) : null}
    </div>
  )
}
