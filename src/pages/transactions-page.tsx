import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Copy, Pencil, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { FilterBar } from '@/components/shared/filter-bar'
import { TransactionForm } from '@/components/shared/transaction-form'
import { FileUploader } from '@/components/shared/file-uploader'
import { EmptyState } from '@/components/shared/empty-state'
import { CurrencyDisplay } from '@/components/shared/currency-display'
import { CategoryIcon } from '@/components/shared/category-icon'
import { TransactionRow } from '@/components/shared/transaction-row'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/contexts/auth-context'
import {
  useAccounts,
  useCategories,
  useCreateSavedFilter,
  useCreateTransaction,
  useDebouncedValue,
  useDeleteTransactions,
  useSavedFilters,
  useTransactions,
  useUpdateTransaction,
} from '@/hooks/use-finance'
import { applyTransactionFilters, searchTransactions, sortTransactions } from '@/lib/filters'
import { toUserMessage } from '@/lib/data/errors'
import { toCreateInput } from '@/lib/transaction-input'
import { formatDate } from '@/lib/dates'
import type { Transaction, TransactionFilters } from '@/types'
import { Inbox } from 'lucide-react'

const PAGE_SIZE = 20

export function TransactionsPage() {
  const { user, client } = useAuth()
  const [params, setParams] = useSearchParams()
  const transactionsQuery = useTransactions()
  const accountsQuery = useAccounts()
  const categoriesQuery = useCategories()
  const savedFiltersQuery = useSavedFilters()
  const createTransaction = useCreateTransaction()
  const updateTransaction = useUpdateTransaction()
  const deleteTransactions = useDeleteTransactions()
  const saveFilter = useCreateSavedFilter()
  const [filters, setFilters] = useState<TransactionFilters>({})
  const [selected, setSelected] = useState<string[]>([])
  const [page, setPage] = useState(0)
  const [sortField, setSortField] = useState<'date' | 'amount' | 'merchant'>('date')
  const [confirmIds, setConfirmIds] = useState<string[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const debouncedQuery = useDebouncedValue(filters.query ?? '', 250)

  const transactions = transactionsQuery.data ?? []
  const accounts = accountsQuery.data ?? []
  const categories = categoriesQuery.data ?? []
  const categoryMap = Object.fromEntries(categories.map((item) => [item.id, item]))
  const accountMap = Object.fromEntries(accounts.map((item) => [item.id, item]))

  const editId = params.get('edit')
  useEffect(() => {
    if (!editId) return
    const requested = transactions.find((item) => item.id === editId)
    if (requested) {
      setEditing(requested)
      setFormOpen(true)
    }
  }, [editId, transactions])

  const filtered = useMemo(() => {
    const next = applyTransactionFilters(transactions, { ...filters, query: undefined })
    return sortTransactions(
      searchTransactions(next, debouncedQuery, Object.fromEntries(categories.map((item) => [item.id, item.name]))),
      sortField,
    )
  }, [transactions, filters, debouncedQuery, categories, sortField])

  const pageItems = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  function openCreate() {
    setEditing(null)
    setParams({})
    setFormOpen(true)
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Transactions"
        description="Search, filter, and manage every movement of money."
        actions={<Button className="w-full sm:w-auto" onClick={openCreate}>Add transaction</Button>}
      />
      <FilterBar
        filters={filters}
        onChange={(value) => {
          setFilters(value)
          setPage(0)
        }}
        accounts={accounts}
        categories={categories}
        savedFilters={savedFiltersQuery.data}
        sortField={sortField}
        onSortChange={(field) => {
          setSortField(field)
          setPage(0)
        }}
        onSave={() => {
          const name = window.prompt('Name this filter')
          if (name) void saveFilter.mutateAsync({ name, filters }).then(() => toast.success('Filter saved'))
        }}
        onApplySaved={(id) => {
          const saved = savedFiltersQuery.data?.find((item) => item.id === id)
          if (saved) setFilters(saved.filters)
        }}
      />

      {selected.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
          <p className="text-sm">{selected.length} selected</p>
          <Select
            onValueChange={(value) => {
              void client.updateTransactions(selected, { categoryId: value }).then(() => {
                toast.success('Category updated')
                setSelected([])
                void transactionsQuery.refetch()
              })
            }}
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Change category" />
            </SelectTrigger>
            <SelectContent>
              {categories
                .filter((item) => !item.parentId)
                .map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Button variant="destructive" size="sm" onClick={() => setConfirmIds(selected)}>
            Delete selected
          </Button>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No matching transactions"
          description="Adjust filters or add a transaction to see it here."
          action={<Button onClick={openCreate}>Add transaction</Button>}
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-xl border border-border bg-card md:block">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="p-3">
                    <Checkbox
                      checked={pageItems.every((item) => selected.includes(item.id)) && pageItems.length > 0}
                      onCheckedChange={(value) =>
                        setSelected(value ? pageItems.map((item) => item.id) : [])
                      }
                      aria-label="Select page"
                    />
                  </th>
                  <th className="p-3">
                    <button onClick={() => setSortField('merchant')}>Merchant</button>
                  </th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Account</th>
                  <th className="p-3">
                    <button onClick={() => setSortField('date')}>Date</button>
                  </th>
                  <th className="p-3 text-right">
                    <button onClick={() => setSortField('amount')}>Amount</button>
                  </th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {pageItems.map((tx) => {
                  const category = tx.categoryId ? categoryMap[tx.categoryId] : undefined
                  return (
                    <tr key={tx.id} className="border-t border-border">
                      <td className="p-3">
                        <Checkbox
                          checked={selected.includes(tx.id)}
                          onCheckedChange={(value) =>
                            setSelected((current) =>
                              value ? [...current, tx.id] : current.filter((id) => id !== tx.id),
                            )
                          }
                          aria-label={`Select ${tx.merchant}`}
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <CategoryIcon name={category?.icon ?? 'CircleEllipsis'} color={category?.color} size="sm" />
                          <div>
                            <p className="font-medium">{tx.merchant || 'Untitled'}</p>
                            <p className="text-xs text-muted-foreground capitalize">{tx.type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">{category?.name ?? '—'}</td>
                      <td className="p-3">{accountMap[tx.accountId]?.name ?? '—'}</td>
                      <td className="p-3">{formatDate(tx.date, user?.dateFormat)}</td>
                      <td className="p-3 text-right">
                        <CurrencyDisplay
                          amount={tx.amount}
                          currency={tx.currency}
                          tone={tx.type === 'income' ? 'income' : tx.type === 'expense' ? 'expense' : 'transfer'}
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => {
                            setEditing(tx)
                            setFormOpen(true)
                          }}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Duplicate"
                            onClick={() =>
                              void createTransaction.mutateAsync({ ...tx, isSample: false, recurringId: null }).then(() =>
                                toast.success('Duplicated'),
                              )
                            }
                          >
                            <Copy className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => setConfirmIds([tx.id])}>
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-border rounded-xl border border-border bg-card px-3 md:hidden">
            {pageItems.map((tx) => {
              const category = tx.categoryId ? categoryMap[tx.categoryId] : undefined
              return (
                <TransactionRow
                  key={tx.id}
                  flush
                  merchant={tx.merchant || 'Untitled'}
                  meta={`${category?.name ?? tx.type} · ${formatDate(tx.date, user?.dateFormat)}`}
                  amount={tx.amount}
                  currency={tx.currency}
                  icon={category?.icon}
                  color={category?.color}
                  tone={tx.type === 'income' ? 'income' : tx.type === 'expense' ? 'expense' : 'transfer'}
                  onClick={() => {
                    setEditing(tx)
                    setFormOpen(true)
                  }}
                />
              )
            })}
          </div>

          <div className="flex items-center justify-between text-sm">
            <p className="text-muted-foreground">
              {filtered.length} transaction{filtered.length === 1 ? '' : 's'}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={(page + 1) * PAGE_SIZE >= filtered.length}
                onClick={() => setPage((value) => value + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) {
            setEditing(null)
            setParams({})
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit transaction' : 'New transaction'}</DialogTitle>
          </DialogHeader>
          <TransactionForm
            accounts={accounts}
            categories={categories}
            defaultType="expense"
            defaultCurrency={user?.currency ?? 'USD'}
            initial={editing ?? undefined}
            submitting={createTransaction.isPending || updateTransaction.isPending}
            onSubmit={async (values) => {
              try {
                if (editing) {
                  await updateTransaction.mutateAsync({ id: editing.id, patch: values })
                  toast.success('Transaction updated')
                } else {
                  await createTransaction.mutateAsync(toCreateInput(values))
                  toast.success('Transaction added')
                }
                setFormOpen(false)
                setParams({})
              } catch (error) {
                toast.error(toUserMessage(error))
              }
            }}
          />
          {editing ? (
            <div className="mt-4">
              <FileUploader
                transactionId={editing.id}
                path={editing.attachmentPath}
                name={editing.attachmentName}
                onChange={() => void transactionsQuery.refetch()}
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmIds.length > 0}
        onOpenChange={() => setConfirmIds([])}
        title="Delete transactions?"
        description="This permanently removes the selected transactions."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          void deleteTransactions.mutateAsync(confirmIds).then(() => {
            toast.success('Deleted')
            setSelected([])
            setConfirmIds([])
          })
        }}
      />
    </div>
  )
}
