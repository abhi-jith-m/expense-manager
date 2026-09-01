import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'flex min-h-24 w-full min-w-0 rounded-[var(--radius-md)] border border-border bg-input px-3 py-2 text-base outline-none transition-colors duration-200 placeholder:text-muted-foreground disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring/40 md:text-sm',
        className,
      )}
      {...props}
    />
  )
}
