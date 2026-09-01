import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Info,
  Repeat,
  Sparkles,
  Target,
  TrendingDown,
  WalletCards,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { FinancialInsight, InsightSeverity, InsightType } from '@/lib/insights-api'

const ICONS: Record<InsightType, LucideIcon> = {
  spending: TrendingDown,
  trend: ArrowUpRight,
  anomaly: AlertTriangle,
  budget: WalletCards,
  behavior: ArrowDownRight,
  savings: Sparkles,
  recurring: Repeat,
  recommendation: Target,
}

const TONE: Record<InsightSeverity, string> = {
  positive: 'border-l-cyan/70 bg-cyan/5',
  warning: 'border-l-warning/70 bg-warning/5',
  critical: 'border-l-rose/70 bg-rose/5',
  info: 'border-l-blue/70 bg-blue/5',
}

export function InsightCard({
  insight,
  onSelect,
}: {
  insight: FinancialInsight
  onSelect?: (insight: FinancialInsight) => void
}) {
  const Icon = ICONS[insight.type] ?? Info
  return (
    <Card
      className={cn(
        'cursor-pointer border-l-2 transition-colors duration-200 hover:bg-card-hover',
        TONE[insight.severity],
      )}
    >
      <CardContent className="space-y-2">
        <button type="button" className="w-full text-left" onClick={() => onSelect?.(insight)}>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-8 items-center justify-center rounded-xl bg-muted">
              <Icon className="size-4 text-primary" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">{insight.title}</p>
                <Badge variant={insight.severity === 'critical' ? 'destructive' : insight.severity === 'warning' ? 'warning' : insight.severity === 'positive' ? 'success' : 'default'}>
                  {insight.severity}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{insight.summary}</p>
              {insight.category ? <p className="text-label mt-1">{insight.category}</p> : null}
            </div>
          </div>
        </button>
      </CardContent>
    </Card>
  )
}
