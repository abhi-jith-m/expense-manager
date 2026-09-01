import { Sparkles } from 'lucide-react'
import { useVio } from '@/contexts/vio-context'

export function VioDashboardInvite() {
  const { openVio } = useVio()
  return (
    <button
      type="button"
      onClick={() => openVio("What's changed this month?")}
      className="flex shrink-0 items-center gap-2 self-start rounded-[11px] px-1 py-1 text-left text-xs text-muted-foreground transition-colors duration-200 hover:text-foreground"
    >
      <Sparkles className="size-3.5 text-primary" />
      Ask Vio what's changing this month
    </button>
  )
}
