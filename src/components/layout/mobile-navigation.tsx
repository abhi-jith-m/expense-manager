import { NavLink } from 'react-router-dom'
import { MOBILE_PRIMARY } from '@/components/layout/nav-config'
import { cn } from '@/lib/utils'

export function MobileBottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-[var(--z-nav)] border-t border-border bg-card/85 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md lg:hidden">
      <div className="grid grid-cols-4 gap-1">
        {MOBILE_PRIMARY.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-2 text-[11px] text-muted-foreground transition-colors duration-200',
                isActive && 'bg-sidebar-accent text-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('size-4', isActive && 'text-primary')} />
                {item.label.replace('Add ', '')}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
