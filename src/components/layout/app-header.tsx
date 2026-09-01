import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Bell, Menu, X } from 'lucide-react'
import { NAV_ITEMS } from '@/components/layout/nav-config'
import { VioTrigger } from '@/components/vio/VioTrigger'
import { Button } from '@/components/ui/button'
import { useNotifications } from '@/hooks/use-finance'
import { cn } from '@/lib/utils'

function pageTitle(pathname: string): string {
  if (pathname === '/') return 'Dashboard'
  const match = NAV_ITEMS.find((item) => item.to !== '/' && pathname.startsWith(item.to))
  return match?.label ?? 'Aureum'
}

export function AppHeader() {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const notifications = useNotifications()
  const unread = (notifications.data ?? []).filter((item) => !item.read).length

  return (
    <>
      <header className="relative z-[var(--z-nav)] flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md sm:px-6">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight">{pageTitle(location.pathname)}</p>
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground lg:hidden">Aureum</p>
        </div>
        <div className="flex items-center gap-2">
          <VioTrigger />
          <Link
            to="/notifications"
            aria-label="Notifications"
            className="relative flex size-9 items-center justify-center rounded-[11px] text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
          >
            <Bell className="size-4" />
            {unread ? (
              <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary" />
            ) : null}
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu className="size-5" />
          </Button>
        </div>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-[var(--z-modal)] lg:hidden">
          <button className="absolute inset-0 bg-[#08070D]/55" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-80 max-w-[86vw] flex-col border-l border-sidebar-border bg-sidebar text-sidebar-foreground">
            <div className="flex items-center justify-between px-4 py-4">
              <p className="text-sm font-semibold">Navigate</p>
              <Button variant="ghost" size="icon" className="text-sidebar-foreground" onClick={() => setMenuOpen(false)} aria-label="Close menu">
                <X className="size-5" />
              </Button>
            </div>
            <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-sidebar-muted transition-colors duration-200',
                      isActive && 'bg-sidebar-accent text-sidebar-foreground',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={cn('size-4', isActive ? 'text-primary' : 'text-sidebar-muted')} />
                      {item.label}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      ) : null}
    </>
  )
}
