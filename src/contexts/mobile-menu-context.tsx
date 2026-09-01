import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

interface MobileMenuContextValue {
  open: boolean
  openMenu: () => void
  closeMenu: () => void
  toggleMenu: () => void
}

const MobileMenuContext = createContext<MobileMenuContextValue | null>(null)

export function MobileMenuProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const openMenu = useCallback(() => setOpen(true), [])
  const closeMenu = useCallback(() => setOpen(false), [])
  const value = useMemo(
    () => ({
      open,
      openMenu,
      closeMenu,
      toggleMenu: () => setOpen((current) => !current),
    }),
    [closeMenu, open, openMenu],
  )
  return <MobileMenuContext.Provider value={value}>{children}</MobileMenuContext.Provider>
}

export function useMobileMenu(): MobileMenuContextValue {
  const context = useContext(MobileMenuContext)
  if (!context) throw new Error('useMobileMenu must be used within MobileMenuProvider')
  return context
}
