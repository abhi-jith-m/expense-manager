import { Sparkles } from 'lucide-react'
import type { FinancialInsight } from '@/lib/insights-api'

export function VioInsightCard({ insight }: { insight: FinancialInsight }) {
  return (
    <div className="rounded-xl border border-border bg-[var(--vio-surface)] px-3 py-2.5 shadow-[inset_3px_0_0_var(--primary)]">
      <p className="flex items-center gap-1.5 text-sm font-medium">
        <Sparkles className="size-3.5 text-primary" />
        {insight.title}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{insight.summary}</p>
    </div>
  )
}
