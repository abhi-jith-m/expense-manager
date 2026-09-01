import type { ReactNode } from 'react'

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <h1 className="text-page hidden lg:block">{title}</h1>
        {description ? <p className="hidden text-sm leading-relaxed text-muted-foreground lg:mt-1 lg:block">{description}</p> : null}
      </div>
      {actions ? <div className="flex min-w-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
