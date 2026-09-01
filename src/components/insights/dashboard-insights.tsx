import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useInsights } from '@/hooks/use-insights'
import type { DateRange } from '@/types'

export function DashboardInsights({ range }: { range: DateRange }) {
  const insights = useInsights(range)
  const top = insights.data?.insights[0]
  if (insights.isError || !top) return null
  return (
    <Card className="shrink-0 border-l-2 border-l-primary">
      <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            <Sparkles className="size-3 text-primary" />
            This period
          </p>
          <p className="mt-1 truncate text-sm font-medium">{top.title}</p>
          <p className="truncate text-xs text-muted-foreground">{top.summary}</p>
        </div>
        <Button size="sm" variant="outline" asChild>
          <Link to="/insights">View details</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
