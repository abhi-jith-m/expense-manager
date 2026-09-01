import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ChevronRight } from 'lucide-react'
import { AppearancePanel } from '@/components/settings/appearance-panel'
import { PageHeader } from '@/components/shared/page-header'
import { CollapsibleSection } from '@/components/shared/collapsible-section'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import type { Profile } from '@/types'

export function SettingsPage() {
  const { user, client, signOut, refresh } = useAuth()
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
        <CardContent className="divide-y divide-border p-0">
          <button
            type="button"
            className="flex min-h-12 w-full items-center justify-between gap-3 px-3.5 text-left"
            onClick={() => navigate('/profile')}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">Profile</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </button>
          <div className="flex min-h-12 items-center justify-between gap-3 px-3.5">
            <Label className="shrink-0">Currency</Label>
            <Select value={user.currency} onValueChange={(value) => void patch({ currency: value })}>
              <SelectTrigger className="min-h-11 w-[8.5rem]">
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
          <div className="flex min-h-12 items-center justify-between gap-3 px-3.5">
            <Label className="shrink-0">Date format</Label>
            <Select value={user.dateFormat} onValueChange={(value) => void patch({ dateFormat: value })}>
              <SelectTrigger className="min-h-11 w-[8.5rem]">
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

      <AppearancePanel />

      <Card>
        <CardContent className="divide-y divide-border p-0">
          {(
            [
              ['budgetAlerts', 'Budget alerts'],
              ['recurringAlerts', 'Recurring due dates'],
              ['goalAlerts', 'Goal milestones'],
              ['importExportAlerts', 'Import and export'],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="flex min-h-12 items-center justify-between gap-3 px-3.5">
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

      <CollapsibleSection title="Security">
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
            className="w-full"
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
          <Button variant="outline" className="w-full" onClick={() => void signOut()}>
            Log out
          </Button>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Data">
        <div className="grid gap-2">
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
        </div>
      </CollapsibleSection>

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
