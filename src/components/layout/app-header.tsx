import { Link, useLocation } from 'react-router-dom'
import { Bell, Menu } from 'lucide-react'
import { NAV_ITEMS } from '@/components/layout/nav-config'
import { VioTrigger } from '@/components/vio/VioTrigger'
import { useMobileMenu } from '@/contexts/mobile-menu-context'
import { useNotifications } from '@/hooks/use-finance'

function pageTitle(pathname: string): string {
  if (pathname === '/') return 'Dashboard'
  const match = NAV_ITEMS.find((item) => item.to !== '/' && pathname.startsWith(item.to))
  return match?.label ?? 'Aureum'
}

export function AppHeader() {
  const location = useLocation()
  const { openMenu } = useMobileMenu()
  const notifications = useNotifications()
  const unread = (notifications.data ?? []).filter((item) => !item.read).length

  return (
    <header className="sticky top-0 z-[var(--z-nav)] flex h-[calc(var(--header-height)+env(safe-area-inset-top))] shrink-0 items-center gap-2 border-b border-border bg-background/90 px-[var(--page-pad)] pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <button
        type="button"
        onClick={openMenu}
        aria-label="Open menu"
        className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-foreground lg:hidden"
      >
        <Menu className="size-5" />
      </button>
      <p className="text-page min-w-0 flex-1 truncate lg:hidden">{pageTitle(location.pathname)}</p>
      <p className="hidden min-w-0 flex-1 truncate text-ui-md font-semibold tracking-tight lg:block">{pageTitle(location.pathname)}</p>
      <div className="flex shrink-0 items-center gap-1">
        <VioTrigger />
        <Link
          to="/notifications"
          aria-label="Notifications"
          className="relative flex size-11 items-center justify-center rounded-[var(--radius-md)] text-muted-foreground"
        >
          <Bell className="size-5" />
          {unread ? <span className="absolute right-2.5 top-2.5 size-1.5 rounded-full bg-primary" /> : null}
        </Link>
      </div>
    </header>
  )
}
