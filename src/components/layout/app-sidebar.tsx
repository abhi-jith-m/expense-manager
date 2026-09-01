import { NavLink } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { NAV_ITEMS } from '@/components/layout/nav-config'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { isLocalBackend } from '@/lib/env'
import { cn } from '@/lib/utils'

export function AppSidebar() {
  const { user, signOut } = useAuth()
  const initials = (user?.fullName || user?.email || 'A')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <aside className="glass-panel hidden h-svh w-[248px] shrink-0 flex-col border-r border-sidebar-border text-sidebar-foreground lg:flex">
      <div className="px-5 py-6">
        <p className="text-ui-md font-semibold tracking-tight">Aureum</p>
        <p className="text-label mt-0.5">Finance</p>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-sidebar-muted transition-colors duration-200 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground',
                isActive && 'bg-sidebar-accent font-medium text-sidebar-foreground',
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
      <div className="space-y-3 border-t border-sidebar-border p-4">
        {isLocalBackend() ? (
          <p className="rounded-xl bg-sidebar-accent px-2.5 py-2 text-ui-xs leading-relaxed text-sidebar-muted">
            Local data mode. Add Supabase to sync across devices.
          </p>
        ) : null}
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={user?.avatarUrl ?? undefined} alt="" />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.fullName}</p>
            <p className="truncate text-xs text-sidebar-muted">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-muted hover:bg-sidebar-accent"
            onClick={() => void signOut()}
            aria-label="Log out"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
