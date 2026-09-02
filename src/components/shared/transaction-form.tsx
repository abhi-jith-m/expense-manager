import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, type Resolver } from 'react-hook-form'
import { transferSchema, type TransactionValues } from '@/schemas'
import type { Account, Category, Transaction } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CURRENCIES } from '@/lib/currency'
import { toISODate } from '@/lib/dates'

const NONE = 'none'

const paymentMethods = [
  { value: 'card', label: 'Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'wallet', label: 'Wallet' },
  { value: 'other', label: 'Other' },
] as const

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-destructive">{message}</p>
}

export function TransactionForm({
  accounts,
  categories,
  defaultType,
  defaultCurrency,
  initial,
  submitting,
  onSubmit,
  wide,
}: {
  accounts: Account[]
  categories: Category[]
  defaultType: Transaction['type']
  defaultCurrency: string
  initial?: Transaction
  submitting?: boolean
  onSubmit: (values: TransactionValues) => Promise<void> | void
  wide?: boolean
}) {
  const form = useForm<TransactionValues>({
    resolver: zodResolver(transferSchema) as Resolver<TransactionValues>,
    defaultValues: {
      type: initial?.type ?? defaultType,
      amount: initial?.amount,
      currency: initial?.currency ?? defaultCurrency,
      categoryId: initial?.categoryId ?? '',
      subcategoryId: initial?.subcategoryId ?? '',
      accountId: initial?.accountId ?? accounts[0]?.id ?? '',
      toAccountId: initial?.toAccountId ?? '',
      merchant: initial?.merchant ?? '',
      description: initial?.description ?? '',
      notes: initial?.notes ?? '',
      date: initial?.date ?? toISODate(new Date()),
      paymentMethod: initial?.paymentMethod ?? 'card',
      tags: initial?.tags ?? [],
    },
  })

  const type = form.watch('type')
  const selectedCategory = form.watch('categoryId')
  const parentCategories = categories.filter(
    (item) => !item.parentId && (type === 'transfer' || item.kind === type),
  )
  const subcategories = categories.filter((item) => item.parentId === selectedCategory)

  useEffect(() => {
    if (!form.getValues('accountId') && accounts[0]?.id) {
      form.setValue('accountId', accounts[0].id, { shouldValidate: true })
    }
  }, [accounts, form])

  function setField(key: keyof TransactionValues, value: TransactionValues[keyof TransactionValues]) {
    form.setValue(key, value as never, { shouldDirty: true, shouldValidate: true })
  }

  return (
    <form
      className={wide ? 'flex min-h-0 flex-col gap-3' : 'grid gap-3'}
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit({
          ...values,
          categoryId: values.categoryId || null,
          subcategoryId: values.subcategoryId || null,
          toAccountId: values.toAccountId || null,
          tags: (Array.isArray(values.tags) ? values.tags : String(values.tags ?? '').split(','))
            .map((tag) => tag.trim())
            .filter(Boolean),
        })
      })}
    >
      <div className={wide ? 'grid gap-3 sm:grid-cols-2 xl:grid-cols-4' : 'grid grid-cols-1 gap-3 sm:grid-cols-2'}>
        <div className="space-y-1">
          <Label htmlFor="type">Type</Label>
          <Select value={type} onValueChange={(value) => setField('type', value as Transaction['type'])}>
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expense">Expense</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="amount">Amount</Label>
          <Input id="amount" type="number" step="0.01" inputMode="decimal" {...form.register('amount')} />
          <FieldError message={form.formState.errors.amount?.message} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="currency">Currency</Label>
          <Select value={form.watch('currency')} onValueChange={(value) => setField('currency', value)}>
            <SelectTrigger id="currency">
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
        <div className="space-y-1">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" {...form.register('date')} />
          <FieldError message={form.formState.errors.date?.message} />
        </div>
        {type !== 'transfer' ? (
          <>
            <div className="space-y-1">
              <Label htmlFor="category">Category</Label>
              <Select
                value={form.watch('categoryId') || NONE}
                onValueChange={(value) => {
                  setField('categoryId', value === NONE ? '' : value)
                  setField('subcategoryId', '')
                }}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {parentCategories.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="subcategory">Subcategory</Label>
              <Select
                value={form.watch('subcategoryId') || NONE}
                onValueChange={(value) => setField('subcategoryId', value === NONE ? '' : value)}
                disabled={!subcategories.length}
              >
                <SelectTrigger id="subcategory">
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {subcategories.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        ) : null}
        <div className="space-y-1">
          <Label htmlFor="account">{type === 'transfer' ? 'From account' : 'Account'}</Label>
          <Select
            value={form.watch('accountId') || undefined}
            onValueChange={(value) => setField('accountId', value)}
            disabled={!accounts.length}
          >
            <SelectTrigger id="account">
              <SelectValue placeholder={accounts.length ? 'Select account' : 'Add an account first'} />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError message={form.formState.errors.accountId?.message} />
        </div>
        {type === 'transfer' ? (
          <div className="space-y-1">
            <Label htmlFor="toAccount">To account</Label>
            <Select
              value={form.watch('toAccountId') || undefined}
              onValueChange={(value) => setField('toAccountId', value)}
              disabled={!accounts.length}
            >
              <SelectTrigger id="toAccount">
                <SelectValue placeholder="Destination" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={form.formState.errors.toAccountId?.message} />
          </div>
        ) : (
          <div className="space-y-1">
            <Label htmlFor="paymentMethod">Payment method</Label>
            <Select
              value={form.watch('paymentMethod')}
              onValueChange={(value) => setField('paymentMethod', value as TransactionValues['paymentMethod'])}
            >
              <SelectTrigger id="paymentMethod">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-1">
          <Label htmlFor="merchant">{type === 'income' ? 'Source' : 'Merchant'}</Label>
          <Input id="merchant" {...form.register('merchant')} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            placeholder="comma, separated"
            defaultValue={initial?.tags.join(', ')}
            onChange={(event) => setField('tags', event.target.value.split(','))}
          />
        </div>
      </div>
      <div className={wide ? 'flex min-h-0 flex-1 flex-col space-y-1' : 'space-y-1'}>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          className={wide ? 'min-h-20 resize-none md:min-h-32' : 'min-h-20'}
          {...form.register('notes')}
        />
      </div>
      {form.formState.errors.root ? <FieldError message={form.formState.errors.root.message} /> : null}
      <div className={wide ? 'flex justify-end' : undefined}>
        <Button
          type="submit"
          disabled={submitting || !accounts.length}
          className={wide ? 'min-h-11 w-full md:w-auto md:min-w-40' : 'min-h-11 w-full sm:w-auto'}
        >
          {submitting ? 'Saving…' : initial ? 'Save changes' : 'Save transaction'}
        </Button>
      </div>
    </form>
  )
}
