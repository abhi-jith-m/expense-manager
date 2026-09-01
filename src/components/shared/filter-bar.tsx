import { useState } from 'react'
import { ListFilter, ArrowUpDown } from 'lucide-react'
import type { Account, Category, SavedFilter, TransactionFilters } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MobileSheet } from '@/components/shared/mobile-sheet'
import { useIsDesktop } from '@/hooks/use-media-query'

export function FilterBar({
  filters,
  onChange,
  accounts,
  categories,
  savedFilters,
  onSave,
  onApplySaved,
  sortField,
  onSortChange,
}: {
  filters: TransactionFilters
  onChange: (filters: TransactionFilters) => void
  accounts: Account[]
  categories: Category[]
  savedFilters?: SavedFilter[]
  onSave?: () => void
  onApplySaved?: (id: string) => void
  sortField?: 'date' | 'amount' | 'merchant'
  onSortChange?: (field: 'date' | 'amount' | 'merchant') => void
}) {
  const desktop = useIsDesktop()
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const activeCount = [
    filters.type && filters.type !== 'all',
    filters.categoryId,
    filters.accountId,
    filters.dateFrom,
    filters.dateTo,
    filters.amountMin !== undefined,
    filters.amountMax !== undefined,
  ].filter(Boolean).length

  const fields = (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="space-y-1.5">
        <Label>Type</Label>
        <Select
          value={filters.type ?? 'all'}
          onValueChange={(value) => onChange({ ...filters, type: value as TransactionFilters['type'] })}
        >
          <SelectTrigger aria-label="Type">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="transfer">Transfer</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Category</Label>
        <Select
          value={filters.categoryId ?? 'all'}
          onValueChange={(value) => onChange({ ...filters, categoryId: value === 'all' ? undefined : value })}
        >
          <SelectTrigger aria-label="Category">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories
              .filter((item) => !item.parentId)
              .map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Account</Label>
        <Select
          value={filters.accountId ?? 'all'}
          onValueChange={(value) => onChange({ ...filters, accountId: value === 'all' ? undefined : value })}
        >
          <SelectTrigger aria-label="Account">
            <SelectValue placeholder="Account" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All accounts</SelectItem>
            {accounts.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="dateFrom">From</Label>
          <Input
            id="dateFrom"
            type="date"
            value={filters.dateFrom ?? ''}
            onChange={(event) => onChange({ ...filters, dateFrom: event.target.value || undefined })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dateTo">To</Label>
          <Input
            id="dateTo"
            type="date"
            value={filters.dateTo ?? ''}
            onChange={(event) => onChange({ ...filters, dateTo: event.target.value || undefined })}
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="amountMin">Min amount</Label>
          <Input
            id="amountMin"
            type="number"
            inputMode="decimal"
            value={filters.amountMin ?? ''}
            onChange={(event) =>
              onChange({
                ...filters,
                amountMin: event.target.value === '' ? undefined : Number(event.target.value),
              })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="amountMax">Max amount</Label>
          <Input
            id="amountMax"
            type="number"
            inputMode="decimal"
            value={filters.amountMax ?? ''}
            onChange={(event) =>
              onChange({
                ...filters,
                amountMax: event.target.value === '' ? undefined : Number(event.target.value),
              })
            }
          />
        </div>
      </div>
      {savedFilters?.length && onApplySaved ? (
        <div className="space-y-1.5">
          <Label>Saved</Label>
          <Select onValueChange={onApplySaved}>
            <SelectTrigger aria-label="Saved filters">
              <SelectValue placeholder="Saved filters" />
            </SelectTrigger>
            <SelectContent>
              {savedFilters.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
    </div>
  )

  return (
    <div className="min-w-0 space-y-3">
      <Input
        placeholder="Search transactions..."
        value={filters.query ?? ''}
        onChange={(event) => onChange({ ...filters, query: event.target.value })}
        aria-label="Search transactions"
      />
      {desktop ? (
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <div className="min-w-0 flex-1">{fields}</div>
          <Button variant="ghost" onClick={() => onChange({})}>
            Reset
          </Button>
          {onSave ? (
            <Button variant="outline" onClick={onSave}>
              Save filter
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="w-full" onClick={() => setFilterOpen(true)}>
            <ListFilter className="size-4" />
            Filter{activeCount ? ` (${activeCount})` : ''}
          </Button>
          <Button variant="outline" className="w-full" onClick={() => setSortOpen(true)}>
            <ArrowUpDown className="size-4" />
            Sort
          </Button>
        </div>
      )}

      <MobileSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        title="Filter transactions"
        footer={
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                onChange({ query: filters.query })
              }}
            >
              Reset
            </Button>
            <Button className="w-full" onClick={() => setFilterOpen(false)}>
              Apply filters
            </Button>
          </div>
        }
      >
        {fields}
        {onSave ? (
          <Button variant="ghost" className="mt-4 w-full" onClick={onSave}>
            Save filter
          </Button>
        ) : null}
      </MobileSheet>

      <MobileSheet open={sortOpen} onOpenChange={setSortOpen} title="Sort">
        <div className="grid gap-1">
          {(
            [
              ['date', 'Date'],
              ['amount', 'Amount'],
              ['merchant', 'Merchant'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className="flex min-h-11 items-center rounded-xl px-3 text-sm data-[active=true]:bg-muted"
              data-active={sortField === value}
              onClick={() => {
                onSortChange?.(value)
                setSortOpen(false)
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </MobileSheet>
    </div>
  )
}
