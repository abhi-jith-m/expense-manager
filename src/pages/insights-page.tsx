import { useMemo, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { DateRangePicker } from '@/components/shared/date-range-picker'
import { EmptyState, ErrorState } from '@/components/shared/empty-state'
import { InsightCard } from '@/components/insights/insight-card'
import { InsightDetail } from '@/components/insights/insight-detail'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/auth-context'
import { useVio } from '@/contexts/vio-context'
import { useInsights } from '@/hooks/use-insights'
import { defaultMonthRange } from '@/lib/dates'
import type { FinancialInsight } from '@/lib/insights-api'
import type { DateRange } from '@/types'

export function InsightsPage() {
  const { user } = useAuth()
  const [range, setRange] = useState<DateRange>(defaultMonthRange)
  const [selected, setSelected] = useState<FinancialInsight | null>(null)
  const { openVio } = useVio()
  const insights = useInsights(range)

  const featured = useMemo(() => insights.data?.insights.slice(0, 5) ?? [], [insights.data])
  const supporting = useMemo(() => insights.data?.insights.slice(5, 10) ?? [], [insights.data])

  if (insights.isError) {
    return (
      <ErrorState
        title="Unable to load insights"
        description="The insights service is unavailable. Start the FastAPI backend and confirm NVIDIA_API_KEY is set. Calculated insights are used if the model is unreachable."
        onRetry={() => void insights.refetch()}
      />
    )
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="AI Financial Insights"
        description="Calculated from your transactions, then explained. Numbers never come from the model."
        actions={<DateRangePicker value={range} onChange={setRange} />}
      />

      {insights.isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
      ) : null}

      {insights.data ? (
        <>
          <Card>
            <CardContent className="space-y-2">
              <p className="text-label">Overview</p>
              <p className="text-lg font-medium tracking-tight">{insights.data.summary}</p>
              <p className="text-sm text-muted-foreground">{insights.data.financial_health_summary}</p>
              {insights.data.used_fallback ? (
                <p className="text-xs text-muted-foreground">AI explanations unavailable. Showing calculated insights.</p>
              ) : null}
            </CardContent>
          </Card>

          <Tabs defaultValue="insights">
            <TabsList>
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="ask">Ask Vio</TabsTrigger>
            </TabsList>
            <TabsContent value="insights" className="space-y-3">
              {featured.length === 0 ? (
                <EmptyState
                  icon={Sparkles}
                  title="No insights yet"
                  description="Add income and expenses in this period to generate grounded financial insights."
                />
              ) : (
                <>
                  <div className="grid gap-3 lg:grid-cols-2">
                    {featured.map((item) => (
                      <InsightCard key={item.id} insight={item} onSelect={setSelected} />
                    ))}
                  </div>
                  {supporting.length ? (
                    <div className="space-y-2">
                      <p className="text-label">Supporting</p>
                      <div className="grid gap-3 lg:grid-cols-2">
                        {supporting.map((item) => (
                          <InsightCard key={item.id} insight={item} onSelect={setSelected} />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </TabsContent>
            <TabsContent value="ask" className="space-y-3">
              <p className="text-sm text-muted-foreground">Ask Vio about your spending trends, budgets, or unusual transactions.</p>
              <Button size="sm" onClick={() => openVio('Ask me about my spending trends.')}>
                <Sparkles className="size-4" />
                Ask Vio
              </Button>
            </TabsContent>
          </Tabs>
        </>
      ) : null}

      <InsightDetail insight={selected} currency={user?.currency ?? 'USD'} onClose={() => setSelected(null)} />
    </div>
  )
}
