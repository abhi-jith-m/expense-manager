import { VioInsightBadge } from '@/components/vio/VioInsightBadge'
import { VioPanel } from '@/components/vio/VioPanel'
import { useVio } from '@/contexts/vio-context'
import { cn } from '@/lib/utils'

export function VioRoot() {
  const { open, closeVio } = useVio()
  return (
    <>
      <VioInsightBadge />
      <button
        type="button"
        aria-label="Close Vio"
        onClick={closeVio}
        className={cn('vio-scrim', open ? 'vio-scrim-open' : 'pointer-events-none opacity-0')}
        hidden={!open}
      />
      <aside
        className={cn('vio-workspace', open ? 'vio-workspace-open' : 'pointer-events-none')}
        aria-hidden={!open}
        inert={!open || undefined}
      >
        <VioPanel />
      </aside>
    </>
  )
}
