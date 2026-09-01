import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTheme } from 'next-themes'
import { useAuth } from '@/contexts/auth-context'
import {
  applyAppearance,
  DEFAULT_APPEARANCE,
  PRESETS,
  readStoredAppearance,
  writeStoredAppearance,
  type AppearancePreferences,
  type AccentId,
  type PresetId,
} from '@/lib/appearance'

interface AppearanceContextValue {
  appearance: AppearancePreferences
  updateAppearance: (patch: Partial<AppearancePreferences>) => void
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null)

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const { user, client, refresh } = useAuth()
  const { setTheme } = useTheme()
  const [appearance, setAppearance] = useState<AppearancePreferences>(() => readStoredAppearance())

  useEffect(() => {
    const stored = readStoredAppearance(user?.id)
    const next = user?.theme ? { ...stored, theme: user.theme } : stored
    setAppearance(next)
    applyAppearance(next)
    setTheme(next.theme)
    writeStoredAppearance(next, user?.id)
  }, [setTheme, user?.id, user?.theme])

  useEffect(() => {
    applyAppearance(appearance)
  }, [appearance])

  const updateAppearance = useCallback(
    (patch: Partial<AppearancePreferences>) => {
      setAppearance((current) => {
        const next = { ...current, ...patch }
        if (patch.preset) {
          const preset = PRESETS.find((item) => item.id === patch.preset)
          if (preset) next.accent = preset.accent
        }
        if (patch.accent) {
          const match = PRESETS.find((item) => item.accent === patch.accent)
          next.preset = (match?.id ?? current.preset) as PresetId
        }
        writeStoredAppearance(next, user?.id)
        applyAppearance(next)
        if (patch.theme) {
          setTheme(patch.theme)
          if (user) void client.updateProfile({ theme: patch.theme }).then(() => void refresh())
        }
        return next
      })
    },
    [client, refresh, setTheme, user],
  )

  const value = useMemo(() => ({ appearance, updateAppearance }), [appearance, updateAppearance])
  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>
}

export function useAppearance(): AppearanceContextValue {
  const context = useContext(AppearanceContext)
  if (!context) {
    return {
      appearance: DEFAULT_APPEARANCE,
      updateAppearance: () => undefined,
    }
  }
  return context
}

export function useRequiredAppearance(): AppearanceContextValue {
  const context = useContext(AppearanceContext)
  if (!context) throw new Error('useAppearance must be used within AppearanceProvider')
  return context
}

export type { AccentId }
