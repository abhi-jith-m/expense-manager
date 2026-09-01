import type { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function ChartCard({
  title,
  description,
  action,
  children,
  className,
  compact,
}: {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  compact?: boolean
}) {
  return (
    <Card className={cn('flex min-h-0 min-w-0 flex-col', className)}>
      <CardHeader className={cn('flex-row items-center justify-between gap-2', compact && 'px-3.5 pt-3')}>
        <div>
          <CardTitle className={compact ? 'text-sm' : undefined}>{title}</CardTitle>
          {description ? <CardDescription className="hidden md:block">{description}</CardDescription> : null}
        </div>
        {action}
      </CardHeader>
      <CardContent className={cn('min-h-0 min-w-0 flex-1', compact ? 'px-3.5 pb-3 pt-1.5' : 'pt-2')}>{children}</CardContent>
    </Card>
  )
}
