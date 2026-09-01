import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { useState, type ReactNode } from 'react'
import { AuthProvider } from '@/contexts/auth-context'
import { AppearanceProvider } from '@/contexts/appearance-context'
import { VioProvider } from '@/contexts/vio-context'
import { TooltipProvider } from '@/components/ui/tooltip'

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <AuthProvider>
          <AppearanceProvider>
            <VioProvider>
              <TooltipProvider>{children}</TooltipProvider>
            </VioProvider>
          </AppearanceProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
