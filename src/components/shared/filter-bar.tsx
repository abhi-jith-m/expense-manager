import type { Account, Category, SavedFilter, TransactionFilters } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function FilterBar({
  filters,
  onChange,
  accounts,
  categories,
  savedFilters,
  onSave,
  onApplySaved,
}: {
  filters: TransactionFilters
  onChange: (filters: TransactionFilters) => void
  accounts: Account[]
  categories: Category[]
  savedFilters?: SavedFilter[]
  onSave?: () => void
  onApplySaved?: (id: string) => void
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 md:flex-row md:flex-wrap md:items-center">
      <Input
        placeholder="Search merchant, notes, tags…"
        value={filters.query ?? ''}
        onChange={(event) => onChange({ ...filters, query: event.target.value })}
        className="md:max-w-xs"
        aria-label="Search transactions"
      />
      <Select
        value={filters.type ?? 'all'}
        onValueChange={(value) => onChange({ ...filters, type: value as TransactionFilters['type'] })}
      >
        <SelectTrigger className="md:w-36" aria-label="Type">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          <SelectItem value="expense">Expense</SelectItem>
          <SelectItem value="income">Income</SelectItem>
          <SelectItem value="transfer">Transfer</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={filters.categoryId ?? 'all'}
        onValueChange={(value) => onChange({ ...filters, categoryId: value === 'all' ? undefined : value })}
      >
        <SelectTrigger className="md:w-44" aria-label="Category">
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
      <Select
        value={filters.accountId ?? 'all'}
        onValueChange={(value) => onChange({ ...filters, accountId: value === 'all' ? undefined : value })}
      >
        <SelectTrigger className="md:w-44" aria-label="Account">
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
      <Button variant="ghost" onClick={() => onChange({})}>
        Reset
      </Button>
      {onSave ? (
        <Button variant="outline" onClick={onSave}>
          Save filter
        </Button>
      ) : null}
      {savedFilters?.length && onApplySaved ? (
        <Select onValueChange={onApplySaved}>
          <SelectTrigger className="md:w-40" aria-label="Saved filters">
            <SelectValue placeholder="Saved" />
          </SelectTrigger>
          <SelectContent>
            {savedFilters.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </div>
  )
}
