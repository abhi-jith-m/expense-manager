import { NavLink, useLocation } from 'react-router-dom'
import { MOBILE_TABS, MORE_ICON } from '@/components/layout/nav-config'
import { useMobileMenu } from '@/contexts/mobile-menu-context'
import { cn } from '@/lib/utils'

export function MobileBottomNav() {
  const location = useLocation()
  const { open, openMenu } = useMobileMenu()
  const onPrimary = MOBILE_TABS.some((item) =>
    item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to),
  )

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[var(--z-nav)] border-t border-border bg-card/92 px-1 pt-0.5 pb-[max(0.25rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">
      <div className="grid grid-cols-5">
        {MOBILE_TABS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-ui-xs leading-none text-muted-foreground [&>span]:max-w-full [&>span]:truncate [&>span]:whitespace-nowrap',
                isActive && 'text-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('size-5', isActive && 'text-primary')} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
        <button
          type="button"
          onClick={openMenu}
          className={cn(
            'flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-ui-xs leading-none text-muted-foreground',
            (open || !onPrimary) && 'text-foreground',
          )}
        >
          <MORE_ICON className={cn('size-5', (open || !onPrimary) && 'text-primary')} />
          More
        </button>
      </div>
    </nav>
  )
}
