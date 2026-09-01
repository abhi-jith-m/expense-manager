import { useEffect, useRef } from 'react'
import { VioChat } from '@/components/vio/VioChat'
import { useVio } from '@/contexts/vio-context'

const FOCUSABLE = 'button:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'

export function VioPanel() {
  const { open, closeVio } = useVio()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    if (!panel) return
    const previous = document.activeElement as HTMLElement | null
    const pushLayout = window.matchMedia('(min-width: 1440px)').matches
    panel.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeVio()
        return
      }
      if (pushLayout || event.key !== 'Tab' || !panel) return
      const nodes = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)]
      if (!nodes.length) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    panel.addEventListener('keydown', onKeyDown)
    return () => {
      panel.removeEventListener('keydown', onKeyDown)
      previous?.focus()
    }
  }, [closeVio, open])

  return (
    <div
      ref={panelRef}
      tabIndex={-1}
      role="complementary"
      aria-label="Vio finance copilot"
      className="vio-panel flex h-full min-h-0 flex-col overflow-hidden outline-none"
    >
      <VioChat />
    </div>
  )
}
