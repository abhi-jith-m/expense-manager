import { Sparkles } from 'lucide-react'
import { Tooltip } from '@/components/ui/tooltip'
import { useVio } from '@/contexts/vio-context'
import { cn } from '@/lib/utils'

export function VioTrigger() {
  const { open, toggleVio, unread } = useVio()

  const button = (
    <button
      type="button"
      aria-label={open ? 'Close Vio' : 'Open Vio'}
      aria-expanded={open}
      onClick={toggleVio}
      className={cn(
        'relative inline-flex size-11 items-center justify-center rounded-[var(--radius-md)] border border-primary/25 bg-primary/12 text-sm font-medium text-primary transition-all duration-200 sm:h-11 sm:w-auto sm:gap-1.5 sm:px-3',
        open && 'ring-2 ring-primary/20',
      )}
    >
      {unread && !open ? <span className="absolute right-2 top-2 size-1.5 rounded-full bg-[#22D3EE]" /> : null}
      <Sparkles className="size-4" />
      <span className="hidden sm:inline">Ask Vio</span>
    </button>
  )

  if (open) return button
  return <Tooltip content="Ask Vio">{button}</Tooltip>
}
