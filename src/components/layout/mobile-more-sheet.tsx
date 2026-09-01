import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from '@/components/layout/nav-config'
import { MobileSheet } from '@/components/shared/mobile-sheet'
import { useMobileMenu } from '@/contexts/mobile-menu-context'
import { cn } from '@/lib/utils'

export function MobileMoreSheet() {
  const { open, closeMenu } = useMobileMenu()

  return (
    <div className="lg:hidden">
      <MobileSheet open={open} onOpenChange={(next) => { if (!next) closeMenu() }} title="More">
        <nav className="grid gap-0.5">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={closeMenu}
              className={({ isActive }) =>
                cn(
                  'flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-muted-foreground',
                  isActive && 'bg-muted text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn('size-4 shrink-0', isActive && 'text-primary')} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </MobileSheet>
    </div>
  )
}
