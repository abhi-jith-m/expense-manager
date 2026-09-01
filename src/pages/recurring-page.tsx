import { useState } from 'react'
import { toast } from 'sonner'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, type Resolver } from 'react-hook-form'
import { PageHeader } from '@/components/shared/page-header'
import { CurrencyDisplay } from '@/components/shared/currency-display'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/contexts/auth-context'
import { useAccounts, useCategories, useCreateRecurring, useInvalidateFinance, useRecurring } from '@/hooks/use-finance'
import { toISODate } from '@/lib/dates'
import { recurringSchema, type RecurringValues } from '@/schemas'
import { toUserMessage } from '@/lib/data/errors'
import { Repeat } from 'lucide-react'

export function RecurringPage() {
  const { user, client } = useAuth()
  const recurring = useRecurring()
  const accounts = useAccounts()
  const categories = useCategories()
  const createRecurring = useCreateRecurring()
  const invalidate = useInvalidateFinance()
  const [open, setOpen] = useState(false)
  const form = useForm<RecurringValues>({
    resolver: zodResolver(recurringSchema) as Resolver<RecurringValues>,
    defaultValues: {
      type: 'expense',
      amount: 0,
      currency: user?.currency ?? 'USD',
      categoryId: '',
      accountId: accounts.data?.[0]?.id ?? '',
      merchant: '',
      notes: '',
      paymentMethod: 'card',
      frequency: 'monthly',
      interval: 1,
      startDate: toISODate(new Date()),
      endDate: '',
    },
  })

  return (
    <div className="space-y-5">
      <PageHeader title="Recurring" description="Due items generate real transactions once per occurrence. Existing dates are never duplicated." actions={<Button onClick={() => setOpen(true)}>Add recurring</Button>} />
      {(recurring.data ?? []).length === 0 ? (
        <EmptyState icon={Repeat} title="No recurring rules" description="Use this for rent, subscriptions, salary, and utilities." action={<Button onClick={() => setOpen(true)}>Create rule</Button>} />
      ) : (
        <div className="grid gap-3">
          {(recurring.data ?? []).map((rule) => (
            <Card key={rule.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{rule.merchant || rule.type}</p>
                  <p className="text-xs text-muted-foreground">
                    {rule.frequency} · next {rule.nextOccurrence} · {rule.active ? 'active' : 'paused'}
                  </p>
                </div>
                <CurrencyDisplay amount={rule.amount} currency={rule.currency} tone={rule.type === 'income' ? 'income' : 'expense'} />
                <div className="flex items-center gap-3">
                  <Switch checked={rule.active} onCheckedChange={(checked) => void client.updateRecurring(rule.id, { active: checked }).then(invalidate)} />
                  <Button size="sm" variant="ghost" onClick={() => void client.deleteRecurring(rule.id).then(() => { toast.success('Removed'); invalidate() })}>Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New recurring transaction</DialogTitle></DialogHeader>
          <form className="grid gap-3" onSubmit={form.handleSubmit(async (values) => {
            try {
              await createRecurring.mutateAsync({
                type: values.type,
                amount: values.amount,
                currency: values.currency,
                categoryId: values.categoryId || null,
                accountId: values.accountId,
                merchant: values.merchant ?? '',
                notes: values.notes ?? '',
                paymentMethod: values.paymentMethod,
                frequency: values.frequency,
                interval: values.interval,
                startDate: values.startDate,
                endDate: values.endDate || null,
                nextOccurrence: values.startDate,
                active: true,
              })
              toast.success('Recurring rule created')
              setOpen(false)
            } catch (error) {
              toast.error(toUserMessage(error))
            }
          })}>
            <div className="grid grid-cols-2 gap-3">
              <Select value={form.watch('type')} onValueChange={(value) => form.setValue('type', value as RecurringValues['type'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
              <Input type="number" step="0.01" {...form.register('amount')} aria-label="Amount" />
            </div>
            <Input placeholder="Merchant or source" {...form.register('merchant')} />
            <Select value={form.watch('accountId')} onValueChange={(value) => form.setValue('accountId', value)}>
              <SelectTrigger><SelectValue placeholder="Account" /></SelectTrigger>
              <SelectContent>
                {(accounts.data ?? []).map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={form.watch('categoryId') ?? ''} onValueChange={(value) => form.setValue('categoryId', value)}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                {(categories.data ?? []).filter((item) => !item.parentId).map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Select value={form.watch('frequency')} onValueChange={(value) => form.setValue('frequency', value as RecurringValues['frequency'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="custom">Custom days</SelectItem>
                </SelectContent>
              </Select>
              <Input type="number" {...form.register('interval')} aria-label="Interval" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Start</Label><Input type="date" {...form.register('startDate')} /></div>
              <div className="space-y-1.5"><Label>End</Label><Input type="date" {...form.register('endDate')} /></div>
            </div>
            <Button type="submit">Save</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
