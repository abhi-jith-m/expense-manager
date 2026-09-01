import * as ProgressPrimitive from '@radix-ui/react-progress'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function Progress({
  className,
  value = 0,
  tone = 'default',
  ...props
}: ComponentProps<typeof ProgressPrimitive.Root> & {
  tone?: 'default' | 'warning' | 'danger'
}) {
  return (
    <ProgressPrimitive.Root
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-muted', className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          'h-full transition-all duration-200',
          tone === 'default' && 'bg-primary',
          tone === 'warning' && 'bg-warning',
          tone === 'danger' && 'bg-destructive',
        )}
        style={{ width: `${Math.min(100, Math.max(0, value ?? 0))}%` }}
      />
    </ProgressPrimitive.Root>
  )
}
