import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'flex min-h-11 w-full min-w-0 rounded-[var(--radius-md)] border border-border bg-input px-3 text-base outline-none transition-colors duration-200 placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring/40 md:min-h-10 md:text-sm',
        className,
      )}
      {...props}
    />
  )
}
