import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { CURRENCIES } from '@/lib/currency'
import { toISODate } from '@/lib/dates'
import { toUserMessage } from '@/lib/data/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useInvalidateFinance } from '@/hooks/use-finance'

const steps = ['Welcome', 'Profile', 'Account', 'Budget', 'Ready']

export function OnboardingPage() {
  const { user, client, refresh } = useAuth()
  const invalidate = useInvalidateFinance()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [currency, setCurrency] = useState(user?.currency ?? 'USD')
  const [accountName, setAccountName] = useState('Everyday account')
  const [accountType, setAccountType] = useState('bank')
  const [openingBalance, setOpeningBalance] = useState('0')
  const [budgetLimit, setBudgetLimit] = useState('1500')
  const [saving, setSaving] = useState(false)

  async function finish(skipRest = false) {
    setSaving(true)
    try {
      await client.updateProfile({ fullName, currency, onboardingCompleted: true })
      if (!skipRest) {
        const account = await client.createAccount({
          name: accountName,
          type: accountType as 'bank',
          openingBalance: Number(openingBalance) || 0,
          currency,
          icon: 'Landmark',
          color: '#3B82F6',
          status: 'active',
        })
        if (Number(budgetLimit) > 0) {
          await client.createBudget({
            name: 'Overall monthly',
            categoryId: null,
            limitAmount: Number(budgetLimit),
            period: 'monthly',
            startDate: toISODate(new Date()),
            endDate: null,
            alertThreshold: 80,
          })
        }
        void account
      }
      invalidate()
      await refresh()
      navigate('/')
    } catch (error) {
      toast.error(toUserMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto min-h-svh max-w-xl px-4 py-10">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        Step {step + 1} of {steps.length}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{steps[step]}</h1>

      {step === 0 ? (
        <div className="mt-6 space-y-4">
          <p className="text-muted-foreground">
            Aureum keeps income, expenses, budgets, and goals in one place. We’ll set a default currency and your first account.
          </p>
          <Button onClick={() => setStep(1)}>Get started</Button>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">What should we call you?</Label>
            <Input id="name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Default currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
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
            <p className="text-xs text-muted-foreground">Aureum does not convert between currencies.</p>
          </div>
          <Button onClick={() => setStep(2)}>Continue</Button>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="accountName">First account</Label>
            <Input id="accountName" value={accountName} onChange={(event) => setAccountName(event.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select value={accountType} onValueChange={setAccountType}>
              <SelectTrigger aria-label="Account type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank">Bank</SelectItem>
                <SelectItem value="credit">Credit card</SelectItem>
                <SelectItem value="savings">Savings</SelectItem>
                <SelectItem value="wallet">Digital wallet</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              value={openingBalance}
              onChange={(event) => setOpeningBalance(event.target.value)}
              aria-label="Opening balance"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setStep(3)}>Continue</Button>
            <Button variant="ghost" onClick={() => void finish(true)}>
              Skip remaining
            </Button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="budget">Monthly spending limit (optional)</Label>
            <Input id="budget" type="number" value={budgetLimit} onChange={(event) => setBudgetLimit(event.target.value)} />
          </div>
          <Button onClick={() => setStep(4)}>Continue</Button>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="mt-6 space-y-4">
          <p className="text-muted-foreground">
            You’re ready. Add a first expense from the dashboard, or import a bank CSV later.
          </p>
          <Button onClick={() => void finish(false)} disabled={saving}>
            {saving ? 'Saving…' : 'Go to dashboard'}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
