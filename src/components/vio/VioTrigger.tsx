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
        'relative inline-flex h-9 items-center gap-1.5 rounded-[11px] border px-2.5 text-sm font-medium transition-all duration-200',
        'bg-[#F3EEFF] border-[#DDD0FF] text-[#6D28D9] hover:bg-[#EBE4FF] hover:shadow-sm',
        'dark:bg-[rgba(139,92,246,0.12)] dark:border-[rgba(139,92,246,0.25)] dark:text-[#C4B5FD] dark:hover:bg-[rgba(139,92,246,0.18)]',
        open && 'ring-2 ring-primary/20',
      )}
    >
      {unread && !open ? (
        <span className="absolute right-1 top-1 size-1.5 rounded-full bg-[#22D3EE]" />
      ) : null}
      <Sparkles className="size-3.5" />
      <span className="hidden sm:inline">Ask Vio</span>
    </button>
  )

  if (open) return button
  return <Tooltip content="Ask Vio">{button}</Tooltip>
}
