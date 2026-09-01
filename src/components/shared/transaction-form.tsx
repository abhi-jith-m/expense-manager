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

const paymentMethods = [
  { value: 'card', label: 'Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'wallet', label: 'Wallet' },
  { value: 'other', label: 'Other' },
] as const

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
  const parentCategories = categories.filter(
    (item) => !item.parentId && (type === 'transfer' || item.kind === type),
  )
  const selectedCategory = form.watch('categoryId')
  const subcategories = categories.filter((item) => item.parentId === selectedCategory)

  return (
    <form
      className={wide ? 'flex h-full min-h-0 flex-col gap-5' : 'grid gap-4'}
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit({
          ...values,
          categoryId: values.categoryId || null,
          subcategoryId: values.subcategoryId || null,
          toAccountId: values.toAccountId || null,
          tags: String(values.tags ?? '')
            .toString()
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean),
        })
      })}
    >
      <div className={wide ? 'grid gap-4 sm:grid-cols-2 xl:grid-cols-4' : 'grid grid-cols-2 gap-4'}>
        <div className="space-y-1.5">
          <Label htmlFor="type">Type</Label>
          <Select value={type} onValueChange={(value) => form.setValue('type', value as Transaction['type'])}>
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
        <div className="space-y-1.5">
          <Label htmlFor="amount">Amount</Label>
          <Input id="amount" type="number" step="0.01" inputMode="decimal" {...form.register('amount')} />
          {form.formState.errors.amount ? (
            <p className="text-xs text-destructive">{form.formState.errors.amount.message}</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="currency">Currency</Label>
          <Select value={form.watch('currency')} onValueChange={(value) => form.setValue('currency', value)}>
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
        <div className="space-y-1.5">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" {...form.register('date')} />
        </div>
        {type !== 'transfer' ? (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <Select
                value={form.watch('categoryId') ?? ''}
                onValueChange={(value) => form.setValue('categoryId', value)}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {parentCategories.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subcategory">Subcategory</Label>
              <Select
                value={form.watch('subcategoryId') ?? ''}
                onValueChange={(value) => form.setValue('subcategoryId', value)}
                disabled={!subcategories.length}
              >
                <SelectTrigger id="subcategory">
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
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
        <div className="space-y-1.5">
          <Label htmlFor="account">{type === 'transfer' ? 'From account' : 'Account'}</Label>
          <Select value={form.watch('accountId')} onValueChange={(value) => form.setValue('accountId', value)}>
            <SelectTrigger id="account">
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {type === 'transfer' ? (
          <div className="space-y-1.5">
            <Label htmlFor="toAccount">To account</Label>
            <Select
              value={form.watch('toAccountId') ?? ''}
              onValueChange={(value) => form.setValue('toAccountId', value)}
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
            {form.formState.errors.toAccountId ? (
              <p className="text-xs text-destructive">{form.formState.errors.toAccountId.message}</p>
            ) : null}
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label htmlFor="paymentMethod">Payment method</Label>
            <Select
              value={form.watch('paymentMethod')}
              onValueChange={(value) => form.setValue('paymentMethod', value as TransactionValues['paymentMethod'])}
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
        <div className="space-y-1.5">
          <Label htmlFor="merchant">{type === 'income' ? 'Source' : 'Merchant'}</Label>
          <Input id="merchant" {...form.register('merchant')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            placeholder="comma, separated"
            defaultValue={initial?.tags.join(', ')}
            onChange={(event) => form.setValue('tags', event.target.value.split(','))}
          />
        </div>
      </div>
      <div className={wide ? 'flex min-h-0 flex-1 flex-col space-y-1.5' : 'space-y-1.5'}>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          className={wide ? 'min-h-32 flex-1 resize-none' : undefined}
          {...form.register('notes')}
        />
      </div>
      <div className={wide ? 'flex justify-end' : undefined}>
        <Button type="submit" disabled={submitting} className={wide ? 'min-w-40' : undefined}>
          {submitting ? 'Saving…' : initial ? 'Save changes' : 'Save transaction'}
        </Button>
      </div>
    </form>
  )
}
