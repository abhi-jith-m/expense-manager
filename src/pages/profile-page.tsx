import { useState } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/page-header'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/auth-context'
import { RECEIPT_ACCEPT } from '@/lib/utils'
import { toUserMessage } from '@/lib/data/errors'

export function ProfilePage() {
  const { user, client, refresh } = useAuth()
  const [name, setName] = useState(user?.fullName ?? '')

  if (!user) return null

  return (
    <div className="page-stack">
      <PageHeader title="Profile" description="Your name and avatar appear across the workspace." />
      <Card>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarImage src={user.avatarUrl ?? undefined} alt="" />
              <AvatarFallback>{user.fullName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <Label htmlFor="avatar" className="cursor-pointer text-sm text-primary">Change photo</Label>
              <Input
                id="avatar"
                type="file"
                accept={RECEIPT_ACCEPT}
                className="hidden"
                onChange={async (event) => {
                  const file = event.target.files?.[0]
                  if (!file) return
                  try {
                    await client.uploadAvatar(file)
                    await refresh()
                    toast.success('Avatar updated')
                  } catch (error) {
                    toast.error(toUserMessage(error))
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <Button onClick={async () => {
            await client.updateProfile({ fullName: name })
            await refresh()
            toast.success('Profile saved')
          }}>Save profile</Button>
        </CardContent>
      </Card>
    </div>
  )
}
