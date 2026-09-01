import { Outlet } from 'react-router-dom'
import { AppHeader } from '@/components/layout/app-header'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { MobileBottomNav } from '@/components/layout/mobile-navigation'
import { MobileMoreSheet } from '@/components/layout/mobile-more-sheet'
import { VioRoot } from '@/components/vio/VioRoot'
import { MobileMenuProvider } from '@/contexts/mobile-menu-context'

export function AppShell() {
  return (
    <MobileMenuProvider>
      <div className="ambient-violet flex min-h-0 min-w-0 overflow-x-clip lg:h-svh lg:overflow-hidden">
        <AppSidebar />
        <div className="flex min-h-svh min-w-0 flex-1 flex-col lg:min-h-0 lg:h-svh">
          <AppHeader />
          <div className="relative flex min-h-0 min-w-0 flex-1">
            <main className="min-h-0 min-w-0 flex-1 overflow-x-clip overflow-y-auto px-[var(--page-pad)] pb-[calc(var(--mobile-nav-height)+env(safe-area-inset-bottom)+1rem)] pt-4 lg:pb-6">
              <div className="mx-auto w-full min-w-0 max-w-[1600px]">
                <Outlet />
              </div>
            </main>
            <VioRoot />
          </div>
          <MobileBottomNav />
          <MobileMoreSheet />
        </div>
      </div>
    </MobileMenuProvider>
  )
}
