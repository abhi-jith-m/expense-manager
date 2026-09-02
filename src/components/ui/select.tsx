import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export const Select = SelectPrimitive.Root
export const SelectValue = SelectPrimitive.Value

export function SelectTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        'flex min-h-11 w-full min-w-0 items-center justify-between rounded-[var(--radius-md)] border border-border bg-input px-3 text-base transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring/40 md:min-h-10 md:text-sm',
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon>
        <ChevronDown className="size-4 opacity-60" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

export function SelectContent({
  className,
  children,
  ...props
}: ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position="popper"
        collisionPadding={16}
        className={cn(
          'pointer-events-auto z-[120] max-h-72 w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)] overflow-auto rounded-xl border border-border bg-card-elevated p-1',
          className,
        )}
        {...props}
        onPointerDownOutside={(event) => {
          event.stopPropagation()
          props.onPointerDownOutside?.(event)
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          props.onCloseAutoFocus?.(event)
        }}
      >
        <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

export function SelectItem({
  className,
  children,
  ...props
}: ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn(
        'relative flex min-h-11 cursor-pointer items-center rounded-md py-2 pl-8 pr-3 text-sm outline-none data-[highlighted]:bg-muted',
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemIndicator className="absolute left-2">
        <Check className="size-4" />
      </SelectPrimitive.ItemIndicator>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}
