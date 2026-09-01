import type { ReactElement } from 'react'
import { ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/utils'

export function ResponsiveChart({
  children,
  className,
}: {
  children: ReactElement
  className?: string
}) {
  return (
    <div className={cn('chart-frame', className)}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  )
}
