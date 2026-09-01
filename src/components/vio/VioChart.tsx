import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartTooltipContent } from '@/components/shared/chart-tooltip'
import type { VioChartSeries } from '@/lib/insights-api'

export function VioChart({ chart, currency }: { chart: VioChartSeries; currency: string }) {
  return (
    <div className="h-36 rounded-xl border border-border bg-card px-2 py-2">
      <ResponsiveContainer width="100%" height="100%">
        {chart.type === 'line' ? (
          <LineChart data={chart.points}>
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip content={<ChartTooltipContent currency={currency} />} />
            <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2} dot={false} />
          </LineChart>
        ) : (
          <BarChart data={chart.points}>
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip content={<ChartTooltipContent currency={currency} />} />
            <Bar dataKey="value" fill="var(--primary)" radius={5} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
