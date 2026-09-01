import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { useInvalidateFinance, useNotifications } from '@/hooks/use-finance'
import { formatDateTime } from '@/lib/dates'
import { Bell } from 'lucide-react'

export function NotificationsPage() {
  const { client } = useAuth()
  const notifications = useNotifications()
  const invalidate = useInvalidateFinance()
  const items = notifications.data ?? []

  return (
    <div className="page-stack">
      <PageHeader
        title="Notifications"
        description="Budget, recurring, goal, and import events. Preferences live in Settings."
        actions={
          items.length ? (
            <Button variant="outline" onClick={() => void client.markAllNotificationsRead().then(() => { toast.success('All marked read'); invalidate() })}>
              Mark all read
            </Button>
          ) : null
        }
      />
      {items.length === 0 ? (
        <EmptyState icon={Bell} title="You're all caught up" description="Meaningful alerts will appear here when budgets, goals, or imports need attention." />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className={item.read ? 'opacity-70' : ''}>
              <CardContent className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</p>
                </div>
                <div className="flex gap-2">
                  {!item.read ? (
                    <Button size="sm" variant="outline" onClick={() => void client.markNotificationRead(item.id).then(invalidate)}>
                      Mark read
                    </Button>
                  ) : null}
                  <Button size="sm" variant="ghost" onClick={() => void client.deleteNotification(item.id).then(invalidate)}>
                    Dismiss
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
