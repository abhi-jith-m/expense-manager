import { useState } from 'react'
import { format } from 'date-fns'
import { CalendarRange } from 'lucide-react'
import { defaultMonthRange, presetRanges, toISODate } from '@/lib/dates'
import type { DateRange } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MobileSheet } from '@/components/shared/mobile-sheet'
import { useIsDesktop } from '@/hooks/use-media-query'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

function RangeFields({
  value,
  onChange,
}: {
  value: DateRange
  onChange: (range: DateRange) => void
}) {
  return (
    <div className="grid gap-3">
      {presetRanges().map((range) => (
        <button
          key={range.label}
          type="button"
          className="flex min-h-11 items-center rounded-xl px-3 text-left text-sm hover:bg-muted"
          onClick={() => onChange(range)}
        >
          {range.label}
        </button>
      ))}
      <button
        type="button"
        className="flex min-h-11 items-center rounded-xl px-3 text-left text-sm hover:bg-muted"
        onClick={() => onChange(defaultMonthRange())}
      >
        Reset to this month
      </button>
      <div className="space-y-2 border-t border-border pt-3">
        <p className="text-xs text-muted-foreground">Custom range</p>
        <div className="space-y-1.5">
          <Label htmlFor="range-from">From</Label>
          <Input
            id="range-from"
            type="date"
            value={toISODate(value.from)}
            onChange={(event) =>
              onChange({
                ...value,
                label: 'Custom range',
                from: new Date(event.target.value),
              })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="range-to">To</Label>
          <Input
            id="range-to"
            type="date"
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
      </div>
    </div>
  )
}

export function DateRangePicker({
  value,
  onChange,
  fullWidth,
}: {
  value: DateRange
  onChange: (range: DateRange) => void
  fullWidth?: boolean
}) {
  const desktop = useIsDesktop()
  const [open, setOpen] = useState(false)
  const label = (
    <>
      <CalendarRange className="size-4 shrink-0" />
      <span className="min-w-0 truncate">
        {format(value.from, 'MMM d')} – {format(value.to, 'MMM d')}
      </span>
    </>
  )

  if (desktop) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className={fullWidth ? 'w-full justify-start gap-2' : 'max-w-full justify-start gap-2'}>
            {label}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[min(16rem,calc(100vw-2rem))]">
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

  return (
    <>
      <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <MobileSheet
        open={open}
        onOpenChange={setOpen}
        title="Date range"
        footer={
          <Button className="w-full" onClick={() => setOpen(false)}>
            Apply
          </Button>
        }
      >
        <RangeFields
          value={value}
          onChange={(range) => {
            onChange(range)
          }}
        />
      </MobileSheet>
    </>
  )
}
