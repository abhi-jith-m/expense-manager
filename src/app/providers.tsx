import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider, useTheme } from 'next-themes'
import { useEffect, useState, type ReactNode } from 'react'
import { AuthProvider, useAuth } from '@/contexts/auth-context'
import { VioProvider } from '@/contexts/vio-context'
import { TooltipProvider } from '@/components/ui/tooltip'

function ThemeSync() {
  const { user } = useAuth()
  const { setTheme } = useTheme()

  useEffect(() => {
    if (user?.theme) setTheme(user.theme)
  }, [setTheme, user?.theme])

  return null
}

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
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
        <AuthProvider>
          <ThemeSync />
          <VioProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </VioProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
