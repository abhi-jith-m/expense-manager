import { useAuth } from '@/contexts/auth-context'
import { useBudgetAlerts } from '@/hooks/use-budget-alerts'

export function AlertsBridge() {
  const { user } = useAuth()
  return user ? <ActiveAlerts /> : null
}

function ActiveAlerts() {
  useBudgetAlerts()
  return null
}
