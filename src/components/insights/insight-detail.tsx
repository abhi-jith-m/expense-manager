import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ThumbsDown, ThumbsUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ChartTooltipContent } from '@/components/shared/chart-tooltip'
import { useInsightFeedback } from '@/hooks/use-insights'
import type { FinancialInsight } from '@/lib/insights-api'
import { CHART_TICK } from '@/lib/palette'

export function InsightDetail({
  insight,
  currency,
  onClose,
}: {
  insight: FinancialInsight | null
  currency: string
  onClose: () => void
}) {
  const feedback = useInsightFeedback()
  const chartData = Object.entries(insight?.metrics ?? {})
    .filter(([, value]) => typeof value === 'number')
    .slice(0, 6)
    .map(([name, value]) => ({ name: name.split('.').slice(-1)[0], value: Number(value) }))

  return (
    <Dialog open={Boolean(insight)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="md:max-w-xl">
        {insight ? (
          <>
            <DialogHeader>
              <DialogTitle>{insight.title}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">{insight.explanation}</p>
            {insight.recommendation ? (
              <div className="rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm">
                {insight.recommendation}
              </div>
            ) : null}
            {chartData.length > 1 ? (
              <div className="chart-frame">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" tick={CHART_TICK} axisLine={false} tickLine={false} />
                    <YAxis tick={CHART_TICK} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltipContent currency={currency} />} />
                    <Bar dataKey="value" fill="var(--primary)" radius={6} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : null}
            <dl className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(insight.metrics).map(([key, value]) => (
                <div key={key} className="rounded-xl bg-muted/40 px-3 py-2">
                  <dt className="text-label">{key.split('.').slice(-1)[0]}</dt>
                  <dd className="tabular font-medium">{typeof value === 'number' ? value.toLocaleString() : String(value)}</dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => feedback.mutate({ insightId: insight.id, feedback: 'helpful' })}>
                <ThumbsUp className="size-4" /> Helpful
              </Button>
              <Button size="sm" variant="ghost" onClick={() => feedback.mutate({ insightId: insight.id, feedback: 'not_helpful' })}>
                <ThumbsDown className="size-4" /> Not helpful
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
