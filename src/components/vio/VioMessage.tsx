import { Sparkles } from 'lucide-react'
import { VioChart } from '@/components/vio/VioChart'
import { VioInsightCard } from '@/components/vio/VioInsightCard'
import { VioMetricCard } from '@/components/vio/VioMetricCard'
import { VioSuggestions } from '@/components/vio/VioSuggestions'
import { VioTransactionCard } from '@/components/vio/VioTransactionCard'
import type { VioChatMessage } from '@/lib/insights-api'

export function VioMessage({
  message,
  currency,
  onFollowUp,
}: {
  message: VioChatMessage
  currency: string
  onFollowUp?: (value: string) => void
}) {
  if (message.role === 'user') {
    return (
      <div className="flex flex-col items-end gap-1">
        <p className="text-[11px] text-muted-foreground">You</p>
        <div className="max-w-[85%] rounded-2xl bg-primary/12 px-3 py-2 text-sm text-foreground">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
        <Sparkles className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-[11px] font-medium text-muted-foreground">Vio</p>
        <p className="text-sm leading-relaxed">{message.content}</p>
        {message.metrics.length ? (
          <div className="grid grid-cols-2 gap-2">
            {message.metrics.map((metric) => (
              <VioMetricCard key={metric.id} metric={metric} currency={currency} />
            ))}
          </div>
        ) : null}
        {message.insights.map((insight) => (
          <VioInsightCard key={insight.id} insight={insight} />
        ))}
        {message.chart ? <VioChart chart={message.chart} currency={currency} /> : null}
        {message.related_transactions.length ? (
          <div className="space-y-1.5">
            <p className="text-[11px] text-muted-foreground">Related transactions</p>
            {message.related_transactions.map((item) => (
              <VioTransactionCard key={item.id} transaction={item} currency={currency} />
            ))}
          </div>
        ) : null}
        {message.grounding ? <p className="text-[11px] text-muted-foreground">{message.grounding}</p> : null}
        {onFollowUp && message.follow_ups.length ? (
          <VioSuggestions suggestions={message.follow_ups} onSelect={onFollowUp} className="pt-1" />
        ) : null}
      </div>
    </div>
  )
}
