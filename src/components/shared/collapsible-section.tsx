import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}) {
  return (
    <details className="group rounded-xl border border-border bg-card" open={defaultOpen || undefined}>
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3.5 text-ui-md font-semibold [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-3.5 pb-3.5">{children}</div>
    </details>
  )
}
