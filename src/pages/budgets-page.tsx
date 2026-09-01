import { useState } from 'react'
import { toast } from 'sonner'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { PageHeader } from '@/components/shared/page-header'
import { CurrencyDisplay } from '@/components/shared/currency-display'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/contexts/auth-context'
import { useBudgets, useCategories, useCreateBudget, useInvalidateFinance, useTransactions } from '@/hooks/use-finance'
import { projectedSpend, remaining, usagePercent } from '@/lib/money'
import { defaultMonthRange, daysInRange, elapsedDays, inRange, toISODate } from '@/lib/dates'
import { budgetSchema, type BudgetValues } from '@/schemas'
import { toUserMessage } from '@/lib/data/errors'
import { WalletCards } from 'lucide-react'

export function BudgetsPage() {
  const { user, client } = useAuth()
  const budgets = useBudgets()
  const categories = useCategories()
  const transactions = useTransactions()
  const createBudget = useCreateBudget()
  const invalidate = useInvalidateFinance()
  const [open, setOpen] = useState(false)
  const range = defaultMonthRange()
  const form = useForm<BudgetValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      name: '',
      categoryId: '',
      limitAmount: 0,
      period: 'monthly',
      startDate: toISODate(new Date()),
      endDate: '',
      alertThreshold: 80,
    },
  })

  return (
    <div className="space-y-5">
      <PageHeader title="Budgets" description="Progress uses real spending in the current period. Alerts only fire from actual usage." actions={<Button onClick={() => setOpen(true)}>Add budget</Button>} />
      {(budgets.data ?? []).length === 0 ? (
        <EmptyState icon={WalletCards} title="No budgets" description="Set a monthly limit for a category or your overall spending." action={<Button onClick={() => setOpen(true)}>Create budget</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(budgets.data ?? []).map((budget) => {
            const spent = (transactions.data ?? [])
              .filter((tx) => tx.type === 'expense' && inRange(tx.date, range) && (!budget.categoryId || tx.categoryId === budget.categoryId))
              .reduce((sum, tx) => sum + tx.amount, 0)
            const percent = usagePercent(spent, budget.limitAmount)
            const left = remaining(budget.limitAmount, spent)
            const projected = projectedSpend(spent, elapsedDays(range), daysInRange(range))
            const over = percent >= 100
            const near = !over && percent >= budget.alertThreshold
            return (
              <Card key={budget.id}>
                <CardContent className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{budget.name}</p>
                      <p className="text-xs text-muted-foreground">{budget.period} · alert at {budget.alertThreshold}%</p>
                    </div>
                    <CurrencyDisplay amount={left} currency={user?.currency ?? 'USD'} tone={over ? 'expense' : 'neutral'} />
                  </div>
                  <Progress value={percent} tone={over ? 'danger' : near ? 'warning' : 'default'} />
                  <p className="text-xs text-muted-foreground">
                    {percent.toFixed(0)}% used · projected {projected.toFixed(0)} this period
                    {over ? ' · Over limit' : near ? ' · Approaching limit' : ''}
                  </p>
                  <Button size="sm" variant="ghost" onClick={() => void client.deleteBudget(budget.id).then(() => { toast.success('Budget removed'); invalidate() })}>
                    Delete
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New budget</DialogTitle></DialogHeader>
          <form className="grid gap-3" onSubmit={form.handleSubmit(async (values) => {
            try {
              await createBudget.mutateAsync({ ...values, categoryId: values.categoryId || null, endDate: values.endDate || null })
              toast.success('Budget created')
              setOpen(false)
            } catch (error) {
              toast.error(toUserMessage(error))
            }
          })}>
            <div className="space-y-1.5"><Label htmlFor="name">Name</Label><Input id="name" {...form.register('name')} /></div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.watch('categoryId') || 'all'} onValueChange={(value) => form.setValue('categoryId', value === 'all' ? '' : value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Overall</SelectItem>
                  {(categories.data ?? []).filter((item) => item.kind === 'expense' && !item.parentId).map((item) => (
                    <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label htmlFor="limitAmount">Limit</Label><Input id="limitAmount" type="number" step="0.01" {...form.register('limitAmount')} /></div>
            <div className="space-y-1.5"><Label htmlFor="alertThreshold">Alert threshold %</Label><Input id="alertThreshold" type="number" {...form.register('alertThreshold')} /></div>
            <Button type="submit">Save</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
