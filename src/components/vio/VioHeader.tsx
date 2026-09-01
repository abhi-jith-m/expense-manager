import { History, Plus, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function VioHeader({
  historyOpen,
  onToggleHistory,
  onNew,
  onClose,
}: {
  historyOpen: boolean
  onToggleHistory: () => void
  onNew: () => void
  onClose: () => void
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
      <div className="flex min-w-0 items-start gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-[10px] bg-primary/12 text-primary">
          <Sparkles className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">Vio</p>
          <p className="text-[11px] text-muted-foreground">Your Personal Finance Copilot</p>
        </div>
      </div>
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label="Conversation history"
          aria-pressed={historyOpen}
          onClick={onToggleHistory}
        >
          <History className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" className="size-8" aria-label="New Vio conversation" onClick={onNew}>
          <Plus className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" className="size-8" aria-label="Close Vio" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>
    </div>
  )
}
