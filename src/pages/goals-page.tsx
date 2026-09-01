import { useState } from 'react'
import { toast } from 'sonner'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { PageHeader } from '@/components/shared/page-header'
import { CurrencyDisplay } from '@/components/shared/currency-display'
import { EmptyState } from '@/components/shared/empty-state'
import { CategoryIcon } from '@/components/shared/category-icon'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/contexts/auth-context'
import { useCreateGoal, useGoals, useInvalidateFinance } from '@/hooks/use-finance'
import { remaining, requiredMonthlySavings, usagePercent } from '@/lib/money'
import { goalSchema, type GoalValues } from '@/schemas'
import { toUserMessage } from '@/lib/data/errors'
import { Target } from 'lucide-react'

export function GoalsPage() {
  const { user, client } = useAuth()
  const goals = useGoals()
  const createGoal = useCreateGoal()
  const invalidate = useInvalidateFinance()
  const [open, setOpen] = useState(false)
  const form = useForm<GoalValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: { name: '', targetAmount: 0, currentAmount: 0, deadline: '', icon: 'Target', color: '#A855F7' },
  })

  return (
    <div className="page-stack">
      <PageHeader title="Goals" description="Track emergency funds and planned purchases against a target date." actions={<Button className="w-full sm:w-auto" onClick={() => setOpen(true)}>Add goal</Button>} />
      {(goals.data ?? []).length === 0 ? (
        <EmptyState icon={Target} title="No goals yet" description="Create a target, then update progress as you save." action={<Button onClick={() => setOpen(true)}>Create goal</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(goals.data ?? []).map((goal) => {
            const left = remaining(goal.targetAmount, goal.currentAmount)
            const percent = usagePercent(goal.currentAmount, goal.targetAmount)
            const monthly = goal.deadline ? requiredMonthlySavings(left, new Date(goal.deadline)) : null
            return (
              <Card key={goal.id}>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CategoryIcon name={goal.icon} color={goal.color} />
                    <div className="flex-1">
                      <p className="font-medium">{goal.name}</p>
                      <p className="text-xs text-muted-foreground">{goal.deadline ? `Due ${goal.deadline}` : 'No deadline'}</p>
                    </div>
                    <CurrencyDisplay amount={goal.currentAmount} currency={user?.currency ?? 'USD'} />
                  </div>
                  <Progress value={percent} />
                  <p className="text-xs text-muted-foreground">
                    {percent.toFixed(0)}% · {left.toFixed(2)} remaining
                    {monthly !== null ? ` · ${monthly.toFixed(2)} / month to stay on track` : ''}
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      defaultValue={goal.currentAmount}
                      aria-label={`Update ${goal.name}`}
                      onBlur={(event) => {
                        const value = Number(event.target.value)
                        if (Number.isFinite(value)) {
                          void client.updateGoal(goal.id, { currentAmount: value }).then(invalidate)
                        }
                      }}
                    />
                    <Button variant="ghost" onClick={() => void client.deleteGoal(goal.id).then(() => { toast.success('Goal removed'); invalidate() })}>Delete</Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New goal</DialogTitle></DialogHeader>
          <form className="grid gap-3" onSubmit={form.handleSubmit(async (values) => {
            try {
              await createGoal.mutateAsync({ ...values, deadline: values.deadline || null })
              toast.success('Goal created')
              setOpen(false)
            } catch (error) {
              toast.error(toUserMessage(error))
            }
          })}>
            <div className="space-y-1.5"><Label htmlFor="name">Name</Label><Input id="name" {...form.register('name')} /></div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Target</Label><Input type="number" step="0.01" {...form.register('targetAmount')} /></div>
              <div className="space-y-1.5"><Label>Current</Label><Input type="number" step="0.01" {...form.register('currentAmount')} /></div>
            </div>
            <div className="space-y-1.5"><Label>Deadline</Label><Input type="date" {...form.register('deadline')} /></div>
            <Button type="submit" className="w-full">Save</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
