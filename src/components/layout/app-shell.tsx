import { Outlet } from 'react-router-dom'
import { AppHeader } from '@/components/layout/app-header'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { MobileBottomNav } from '@/components/layout/mobile-navigation'
import { VioRoot } from '@/components/vio/VioRoot'

export function AppShell() {
  return (
    <div className="ambient-violet flex h-svh overflow-hidden">
      <AppSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AppHeader />
        <div className="relative flex min-h-0 min-w-0 flex-1">
          <main className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 pb-24 pt-4 sm:px-6 lg:px-6 lg:pb-4">
            <div className="mx-auto flex h-full min-h-0 w-full max-w-[1600px] flex-col">
              <Outlet />
            </div>
          </main>
          <VioRoot />
        </div>
        <MobileBottomNav />
      </div>
    </div>
  )
}
