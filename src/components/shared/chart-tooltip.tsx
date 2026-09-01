import { formatMoney } from '@/lib/currency'

export function ChartTooltipContent({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean
  payload?: Array<{ name?: string; value?: number | string; color?: string; dataKey?: string | number }>
  label?: string
  currency: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-card-elevated px-3 py-2 shadow-card">
      {label ? <p className="mb-1 text-[11px] text-muted-foreground">{label}</p> : null}
      <div className="space-y-0.5">
        {payload.map((item) => (
          <p key={String(item.dataKey ?? item.name)} className="flex items-center gap-2 text-xs">
            <span className="size-1.5 rounded-full" style={{ background: item.color }} />
            <span className="capitalize text-muted-foreground">{item.name ?? item.dataKey}</span>
            <span className="tabular font-medium text-foreground">{formatMoney(Number(item.value), currency)}</span>
          </p>
        ))}
      </div>
    </div>
  )
}
