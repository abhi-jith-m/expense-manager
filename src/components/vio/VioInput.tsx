import { useEffect, useRef, type KeyboardEvent } from 'react'
import { ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function VioInput({
  value,
  onChange,
  onSend,
  disabled,
}: {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  disabled?: boolean
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    node.style.height = '0px'
    node.style.height = `${Math.min(node.scrollHeight, 120)}px`
  }, [value])

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      if (value.trim() && !disabled) onSend()
    }
  }

  return (
    <div className="flex items-end gap-2 border-t border-border px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
      <textarea
        ref={ref}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        disabled={disabled}
        rows={1}
        placeholder="Ask Vio about your finances..."
        aria-label="Ask Vio about your finances"
        className={cn(
          'max-h-28 min-h-11 flex-1 resize-none rounded-[11px] border border-border bg-input px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
        )}
      />
      <Button
        size="icon"
        aria-label="Send message"
        disabled={disabled || !value.trim()}
        onClick={onSend}
        className="size-11 shrink-0"
      >
        <ArrowUp className="size-4" />
      </Button>
    </div>
  )
}
