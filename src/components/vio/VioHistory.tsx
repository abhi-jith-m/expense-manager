import { format, isToday, isYesterday } from 'date-fns'
import { Trash2 } from 'lucide-react'
import type { ConversationSummary } from '@/lib/insights-api'

function groupLabel(iso: string): string {
  const date = new Date(iso)
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'MMM d')
}

export function VioHistory({
  items,
  activeId,
  onSelect,
  onDelete,
}: {
  items: ConversationSummary[]
  activeId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}) {
  if (!items.length) {
    return <p className="px-3 py-3 text-xs text-muted-foreground">No previous conversations.</p>
  }

  const groups = new Map<string, ConversationSummary[]>()
  for (const item of items) {
    const label = groupLabel(item.updated_at)
    groups.set(label, [...(groups.get(label) ?? []), item])
  }

  return (
    <div className="max-h-56 space-y-3 overflow-y-auto border-b border-border px-3 py-2">
      {[...groups.entries()].map(([label, rows]) => (
        <div key={label}>
          <p className="px-1 pb-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
          <div className="space-y-0.5">
            {rows.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-2 rounded-xl px-2 py-1.5 ${item.id === activeId ? 'bg-primary/10' : 'hover:bg-muted'}`}
              >
                <button type="button" className="min-w-0 flex-1 truncate text-left text-xs" onClick={() => onSelect(item.id)}>
                  {item.title || 'New conversation'}
                </button>
                <button type="button" aria-label="Delete conversation" className="text-muted-foreground hover:text-destructive" onClick={() => onDelete(item.id)}>
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
