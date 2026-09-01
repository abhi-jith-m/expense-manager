import { format } from 'date-fns'
import { CalendarRange } from 'lucide-react'
import { defaultMonthRange, presetRanges, toISODate } from '@/lib/dates'
import type { DateRange } from '@/types'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'

export function DateRangePicker({
  value,
  onChange,
}: {
  value: DateRange
  onChange: (range: DateRange) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="justify-start gap-2">
          <CalendarRange className="size-4" />
          <span className="hidden sm:inline">{value.label}</span>
          <span className="text-muted-foreground">
            {format(value.from, 'MMM d')} – {format(value.to, 'MMM d')}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {presetRanges().map((range) => (
          <DropdownMenuItem key={range.label} onClick={() => onChange(range)}>
            {range.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem onClick={() => onChange(defaultMonthRange())}>Reset to this month</DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="space-y-2 p-2">
          <p className="text-xs text-muted-foreground">Custom range</p>
          <Input
            type="date"
            aria-label="From date"
            value={toISODate(value.from)}
            onChange={(event) =>
              onChange({
                ...value,
                label: 'Custom range',
                from: new Date(event.target.value),
              })
            }
          />
          <Input
            type="date"
            aria-label="To date"
            value={toISODate(value.to)}
            onChange={(event) =>
              onChange({
                ...value,
                label: 'Custom range',
                to: new Date(event.target.value),
              })
            }
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
