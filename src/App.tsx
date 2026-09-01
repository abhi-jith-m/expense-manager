import { Toaster } from '@/components/ui/sonner'
import { AppProviders } from '@/app/providers'
import { AppRouter } from '@/app/router'
import { AlertsBridge } from '@/app/alerts-bridge'

export default function App() {
  return (
    <AppProviders>
      <AlertsBridge />
      <AppRouter />
      <Toaster />
    </AppProviders>
  )
}
