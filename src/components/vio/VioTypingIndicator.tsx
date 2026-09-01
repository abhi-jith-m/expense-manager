import { Sparkles } from 'lucide-react'

const STAGES = [
  'Analyzing your spending...',
  'Checking spending trends...',
  'Looking for unusual patterns...',
  'Preparing your insights...',
]

export function VioTypingIndicator({ stage }: { stage?: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/12">
        <Sparkles className="size-3.5 text-primary" />
      </span>
      <div className="rounded-2xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Vio</p>
        <p className="mt-0.5">{stage || STAGES[0]}</p>
      </div>
    </div>
  )
}

export function nextVioStage(index: number): string {
  return STAGES[index % STAGES.length]
}
