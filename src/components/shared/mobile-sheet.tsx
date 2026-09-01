import type { ReactNode } from 'react'
import { Drawer } from 'vaul'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MobileSheet({
  open,
  onOpenChange,
  title,
  children,
  footer,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[110] bg-[#08070D]/50" />
        <Drawer.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-[110] flex max-h-[92svh] flex-col rounded-t-[var(--radius)] border border-border bg-card outline-none',
            'pb-[max(1rem,env(safe-area-inset-bottom))]',
          )}
        >
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border" />
          <div className="flex items-center justify-between px-4 py-2">
            <div>
              <Drawer.Title className="text-base font-semibold">{title}</Drawer.Title>
              <Drawer.Description className="sr-only">{title}</Drawer.Description>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={() => onOpenChange(false)}
              className="flex size-11 items-center justify-center rounded-[var(--radius-md)] text-muted-foreground"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{children}</div>
          {footer ? <div className="shrink-0 border-t border-border px-4 pt-3">{footer}</div> : null}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
