import { useState } from 'react'
import { toast } from 'sonner'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { PageHeader } from '@/components/shared/page-header'
import { CurrencyDisplay } from '@/components/shared/currency-display'
import { EmptyState } from '@/components/shared/empty-state'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/contexts/auth-context'
import { useAccounts, useCreateAccount, useInvalidateFinance, useTransactions } from '@/hooks/use-finance'
import { accountBalance } from '@/lib/money'
import { accountSchema, type AccountValues } from '@/schemas'
import { toUserMessage } from '@/lib/data/errors'
import { Landmark } from 'lucide-react'
import type { Account } from '@/types'

export function AccountsPage() {
  const { user, client } = useAuth()
  const accounts = useAccounts()
  const transactions = useTransactions()
  const createAccount = useCreateAccount()
  const invalidate = useInvalidateFinance()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Account | null>(null)
  const [removeId, setRemoveId] = useState<string | null>(null)
  const form = useForm<AccountValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: { name: '', type: 'bank', openingBalance: 0, currency: user?.currency ?? 'USD', icon: 'Landmark', color: '#3B82F6' },
  })

  return (
    <div className="space-y-5">
      <PageHeader title="Accounts" description="Wallets, banks, and cards. Transfers move money without counting as income or expense." actions={<Button onClick={() => { setEditing(null); form.reset(); setOpen(true) }}>Add account</Button>} />
      {(accounts.data ?? []).length === 0 ? (
        <EmptyState icon={Landmark} title="No accounts yet" description="Create at least one account before adding transactions." action={<Button onClick={() => setOpen(true)}>Add account</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(accounts.data ?? []).map((account) => (
            <Card key={account.id}>
              <CardContent className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{account.name}</p>
                    <p className="text-xs capitalize text-muted-foreground">{account.type} · {account.status}</p>
                  </div>
                  <CurrencyDisplay amount={accountBalance(account, transactions.data ?? [])} currency={account.currency} className="text-lg" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setEditing(account); form.reset(account); setOpen(true) }}>Edit</Button>
                  <Button size="sm" variant="outline" onClick={() => void client.updateAccount(account.id, { status: account.status === 'active' ? 'archived' : 'active' }).then(invalidate)}>
                    {account.status === 'active' ? 'Archive' : 'Restore'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setRemoveId(account.id)}>Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit account' : 'New account'}</DialogTitle></DialogHeader>
          <form className="grid gap-3" onSubmit={form.handleSubmit(async (values) => {
            try {
              if (editing) {
                await client.updateAccount(editing.id, values)
                toast.success('Account updated')
              } else {
                await createAccount.mutateAsync({ ...values, status: 'active' })
                toast.success('Account created')
              }
              invalidate()
              setOpen(false)
            } catch (error) {
              toast.error(toUserMessage(error))
            }
          })}>
            <div className="space-y-1.5"><Label htmlFor="name">Name</Label><Input id="name" {...form.register('name')} /></div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.watch('type')} onValueChange={(value) => form.setValue('type', value as AccountValues['type'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank</SelectItem>
                  <SelectItem value="credit">Credit card</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="wallet">Digital wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label htmlFor="openingBalance">Opening balance</Label><Input id="openingBalance" type="number" step="0.01" {...form.register('openingBalance')} /></div>
            <Button type="submit">Save</Button>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={Boolean(removeId)} onOpenChange={() => setRemoveId(null)} title="Delete account?" description="Accounts with transactions cannot be deleted." confirmLabel="Delete" destructive onConfirm={() => {
        if (!removeId) return
        void client.deleteAccountRecord(removeId).then(() => {
          toast.success('Account deleted')
          invalidate()
          setRemoveId(null)
        }).catch((error) => toast.error(toUserMessage(error)))
      }} />
    </div>
  )
}
