import { useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useVio } from '@/contexts/vio-context'
import { getLatestInsights } from '@/lib/insights-api'

export function VioInsightBadge() {
  const { session, user } = useAuth()
  const { open, markRead, setUnread } = useVio()

  useEffect(() => {
    if (!session || !user) return
    let cancelled = false
    void getLatestInsights(session.accessToken, user.id).then((latest) => {
      if (cancelled || !latest) return
      const noteworthy = latest.insights.find((item) => item.severity === 'warning' || item.severity === 'critical')
      if (!noteworthy) return
      const key = `${latest.generated_at}:${noteworthy.id}`
      if (open) {
        markRead()
        sessionStorage.setItem('vio.seen-insight', key)
        return
      }
      if (sessionStorage.getItem('vio.seen-insight') === key) return
      setUnread(true)
    }).catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [markRead, open, session, setUnread, user])

  return null
}
