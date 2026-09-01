import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/page-header'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/contexts/auth-context'
import { useCategories, useInvalidateFinance } from '@/hooks/use-finance'
import { CURRENCIES } from '@/lib/currency'
import { DATE_FORMATS } from '@/lib/dates'
import { buildSampleData } from '@/lib/data/seed'
import { downloadBlob } from '@/lib/utils'
import { toUserMessage } from '@/lib/data/errors'
import { exportFilename } from '@/lib/import-export'
import type { Profile, ThemePreference } from '@/types'

export function SettingsPage() {
  const { user, client, signOut, refresh } = useAuth()
  const { setTheme } = useTheme()
  const navigate = useNavigate()
  const invalidate = useInvalidateFinance()
  const categories = useCategories()
  const [password, setPassword] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!user) return null

  async function patch(update: Partial<Profile>) {
    await client.updateProfile(update)
    await refresh()
    toast.success('Saved')
  }

  return (
    <div className="page-stack">
      <PageHeader title="Settings" description="Appearance, currency, notifications, and account security." />

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => navigate('/profile')}>
            Edit profile
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <Label>Theme</Label>
            <Select
              value={user.theme}
              onValueChange={(value) => {
                const theme = value as ThemePreference
                setTheme(theme)
                void patch({ theme })
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Currency</CardTitle>
          <CardDescription>Amounts are never auto-converted between currencies.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-1.5">
            <Label>Default currency</Label>
            <Select value={user.currency} onValueChange={(value) => void patch({ currency: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((item) => (
                  <SelectItem key={item.code} value={item.code}>
                    {item.code} · {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Date format</Label>
            <Select value={user.dateFormat} onValueChange={(value) => void patch({ dateFormat: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_FORMATS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {(
            [
              ['budgetAlerts', 'Budget alerts'],
              ['recurringAlerts', 'Recurring due dates'],
              ['goalAlerts', 'Goal milestones'],
              ['importExportAlerts', 'Import and export'],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="flex min-h-11 items-center justify-between gap-4 py-2 first:pt-0 last:pb-0">
              <Label htmlFor={key} className="min-w-0 flex-1">
                {label}
              </Label>
              <Switch
                id={key}
                checked={user.notificationPreferences[key]}
                onCheckedChange={(checked) =>
                  void patch({ notificationPreferences: { ...user.notificationPreferences, [key]: checked } })
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              placeholder="New password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <Button
              className="w-full sm:w-auto"
              onClick={() =>
                void client
                  .updatePassword(password)
                  .then(() => {
                    toast.success('Password updated')
                    setPassword('')
                  })
                  .catch((error) => toast.error(toUserMessage(error)))
              }
            >
              Change password
            </Button>
          </div>
          <Button variant="outline" className="w-full" onClick={() => void signOut()}>
            Log out of this session
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data</CardTitle>
          <CardDescription>Sample data is tagged and can be removed without touching real records.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={async () => {
              const payload = await client.exportAll()
              downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), exportFilename('workspace', 'json'))
              toast.success('Workspace exported')
            }}
          >
            Export all data
          </Button>
          <Button variant="outline" className="w-full" onClick={() => navigate('/import-export')}>
            Import data
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={async () => {
              const seed = buildSampleData(user.id, user.currency)
              for (const account of seed.accounts) {
                await client.createAccount({
                  name: account.name,
                  type: account.type,
                  openingBalance: account.openingBalance,
                  currency: account.currency,
                  icon: account.icon,
                  color: account.color,
                  status: account.status,
                })
              }
              const createdAccounts = await client.listAccounts()
              const txs = seed.transactionsFor(categories.data ?? []).map((tx, index) => ({
                ...tx,
                accountId: createdAccounts[index % createdAccounts.length]?.id ?? createdAccounts[0].id,
              }))
              for (const tx of txs) {
                await client.createTransaction({
                  type: tx.type,
                  amount: tx.amount,
                  currency: tx.currency,
                  categoryId: tx.categoryId,
                  subcategoryId: tx.subcategoryId,
                  accountId: tx.accountId,
                  toAccountId: tx.toAccountId,
                  merchant: tx.merchant,
                  description: tx.description,
                  notes: tx.notes,
                  date: tx.date,
                  paymentMethod: tx.paymentMethod,
                  tags: tx.tags,
                  recurringId: null,
                  attachmentPath: null,
                  attachmentName: null,
                  isSample: true,
                })
              }
              for (const budget of seed.budgets(categories.data ?? []))
                await client.createBudget({
                  name: budget.name,
                  categoryId: budget.categoryId,
                  limitAmount: budget.limitAmount,
                  period: budget.period,
                  startDate: budget.startDate,
                  endDate: budget.endDate,
                  alertThreshold: budget.alertThreshold,
                })
              for (const goal of seed.goals)
                await client.createGoal({
                  name: goal.name,
                  targetAmount: goal.targetAmount,
                  currentAmount: goal.currentAmount,
                  deadline: goal.deadline,
                  icon: goal.icon,
                  color: goal.color,
                })
              invalidate()
              toast.success('Sample data added. It is marked as sample.')
            }}
          >
            Try sample data
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={async () => {
              const all = await client.listTransactions()
              const sampleIds = all.filter((tx) => tx.isSample).map((tx) => tx.id)
              if (sampleIds.length) await client.deleteTransactions(sampleIds)
              invalidate()
              toast.success(sampleIds.length ? 'Sample transactions removed' : 'No sample transactions found')
            }}
          >
            Remove sample data
          </Button>
          <Button variant="destructive" className="w-full" onClick={() => setConfirmDelete(true)}>
            Delete account
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete your account?"
        description="This permanently removes your financial data from this workspace."
        confirmLabel="Delete account"
        destructive
        onConfirm={() => void client.deleteAccount().then(() => navigate('/signup'))}
      />
    </div>
  )
}
