import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

interface VioContextValue {
  open: boolean
  unread: boolean
  pendingPrompt: string | null
  openVio: (prompt?: string) => void
  closeVio: () => void
  minimizeVio: () => void
  toggleVio: () => void
  clearPendingPrompt: () => void
  markRead: () => void
  setUnread: (value: boolean) => void
}

const VioContext = createContext<VioContextValue | null>(null)

export function VioProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(false)
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null)

  const openVio = useCallback((prompt?: string) => {
    setOpen(true)
    setUnread(false)
    if (prompt) setPendingPrompt(prompt)
  }, [])

  const closeVio = useCallback(() => {
    setOpen(false)
    setPendingPrompt(null)
  }, [])

  const value = useMemo<VioContextValue>(
    () => ({
      open,
      unread,
      pendingPrompt,
      openVio,
      closeVio,
      minimizeVio: closeVio,
      toggleVio: () => (open ? closeVio() : openVio()),
      clearPendingPrompt: () => setPendingPrompt(null),
      markRead: () => setUnread(false),
      setUnread,
    }),
    [closeVio, open, openVio, pendingPrompt, unread],
  )

  return <VioContext.Provider value={value}>{children}</VioContext.Provider>
}

export function useVio(): VioContextValue {
  const context = useContext(VioContext)
  if (!context) throw new Error('useVio must be used within VioProvider')
  return context
}
