import { cn } from '@/lib/utils'

export function VioSuggestions({
  suggestions,
  onSelect,
  className,
}: {
  suggestions: string[]
  onSelect: (value: string) => void
  className?: string
}) {
  if (!suggestions.length) return null
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {suggestions.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onSelect(item)}
          className="rounded-full border border-border bg-card px-3 py-1.5 text-left text-xs text-foreground transition-colors duration-200 hover:border-primary/40 hover:bg-primary/8"
        >
          {item}
        </button>
      ))}
    </div>
  )
}
