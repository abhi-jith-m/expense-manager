import type { ReactNode } from 'react'

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <div className="grid min-h-svh bg-background lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-sidebar px-12 py-12 text-sidebar-foreground lg:flex">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background:
              'radial-gradient(circle at 82% 12%, rgb(139 92 246 / 0.14), transparent 36%), radial-gradient(circle at 12% 88%, rgb(34 211 238 / 0.06), transparent 32%)',
          }}
        />
        <div className="relative">
          <p className="text-sm font-semibold tracking-tight">Aureum</p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-sidebar-muted">Midnight Violet</p>
        </div>
        <div className="relative max-w-md space-y-4">
          <h2 className="text-4xl font-medium leading-[1.15] tracking-tight">
            See your money clearly, without the noise.
          </h2>
          <p className="text-sm leading-relaxed text-sidebar-muted">
            A calm workspace for income, spending, budgets, and goals — designed for long sessions, not dashboard theater.
          </p>
        </div>
        <p className="relative text-xs text-sidebar-muted">Private by default. Your data stays isolated to your account.</p>
      </div>
      <div className="flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <p className="mb-5 text-sm font-semibold lg:hidden">Aureum</p>
          <h1 className="text-2xl font-medium tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-5">{children}</div>
        </div>
      </div>
    </div>
  )
}
