import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { useInsights } from '@/hooks/use-insights'
import type { DateRange } from '@/types'

export function DashboardInsights({ range }: { range: DateRange }) {
  const insights = useInsights(range)
  const top = insights.data?.insights[0]
  if (insights.isError || !top) return null
  return (
    <Link
      to="/insights"
      className="flex min-h-11 min-w-0 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2"
    >
      <Sparkles className="size-3.5 shrink-0 text-primary" />
      <p className="min-w-0 flex-1 truncate text-sm">{top.title}</p>
    </Link>
  )
}
