export const ACCENTS = ['violet', 'purple', 'indigo', 'blue', 'cyan', 'pink', 'rose'] as const
export type AccentId = (typeof ACCENTS)[number]

export const PRESETS = [
  { id: 'midnight', label: 'Midnight Violet', accent: 'violet' },
  { id: 'royal', label: 'Royal Purple', accent: 'purple' },
  { id: 'ocean', label: 'Ocean Blue', accent: 'blue' },
  { id: 'electric', label: 'Electric Pink', accent: 'pink' },
] as const
export type PresetId = (typeof PRESETS)[number]['id']

export interface AppearancePreferences {
  theme: 'light' | 'dark' | 'system'
  accent: AccentId
  preset: PresetId
  density: 'compact' | 'comfortable' | 'spacious'
  textSize: 'small' | 'default' | 'large'
  typography: 'modern' | 'system' | 'data'
  cornerStyle: 'soft' | 'rounded' | 'sharp'
  interfaceStyle: 'minimal' | 'balanced' | 'expressive'
  motion: 'full' | 'reduced'
}

export const DEFAULT_APPEARANCE: AppearancePreferences = {
  theme: 'system',
  accent: 'violet',
  preset: 'midnight',
  density: 'comfortable',
  textSize: 'default',
  typography: 'modern',
  cornerStyle: 'soft',
  interfaceStyle: 'balanced',
  motion: 'full',
}

export const APPEARANCE_STORAGE_KEY = 'aureum-appearance'

const TEXT_SCALE = { small: '0.92', default: '1', large: '1.08' } as const
const RADIUS = { sharp: '0.5rem', soft: '0.75rem', rounded: '1.125rem' } as const

export function parseAppearance(raw: unknown): AppearancePreferences {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_APPEARANCE }
  const value = raw as Partial<AppearancePreferences>
  return {
    theme: value.theme === 'light' || value.theme === 'dark' || value.theme === 'system' ? value.theme : DEFAULT_APPEARANCE.theme,
    accent: ACCENTS.includes(value.accent as AccentId) ? (value.accent as AccentId) : DEFAULT_APPEARANCE.accent,
    preset: PRESETS.some((item) => item.id === value.preset) ? (value.preset as PresetId) : DEFAULT_APPEARANCE.preset,
    density: value.density === 'compact' || value.density === 'spacious' ? value.density : 'comfortable',
    textSize: value.textSize === 'small' || value.textSize === 'large' ? value.textSize : 'default',
    typography: value.typography === 'system' || value.typography === 'data' ? value.typography : 'modern',
    cornerStyle: value.cornerStyle === 'rounded' || value.cornerStyle === 'sharp' ? value.cornerStyle : DEFAULT_APPEARANCE.cornerStyle,
    interfaceStyle:
      value.interfaceStyle === 'minimal' || value.interfaceStyle === 'expressive' ? value.interfaceStyle : 'balanced',
    motion: value.motion === 'reduced' ? 'reduced' : 'full',
  }
}

export function readStoredAppearance(userId?: string | null): AppearancePreferences {
  try {
    const raw = localStorage.getItem(appearanceStorageKey(userId)) ?? localStorage.getItem(APPEARANCE_STORAGE_KEY)
    return parseAppearance(raw ? JSON.parse(raw) : null)
  } catch {
    return { ...DEFAULT_APPEARANCE }
  }
}

export function writeStoredAppearance(value: AppearancePreferences, userId?: string | null) {
  const payload = JSON.stringify(value)
  localStorage.setItem(APPEARANCE_STORAGE_KEY, payload)
  if (userId) localStorage.setItem(appearanceStorageKey(userId), payload)
}

export function applyAppearance(value: AppearancePreferences) {
  const root = document.documentElement
  root.dataset.accent = value.accent
  root.dataset.density = value.density
  root.dataset.typography = value.typography
  root.dataset.corners = value.cornerStyle
  root.dataset.style = value.interfaceStyle
  root.dataset.motion = value.motion
  root.style.setProperty('--text-scale', TEXT_SCALE[value.textSize])
  root.style.setProperty('--radius', RADIUS[value.cornerStyle])
}

export function appearanceStorageKey(userId?: string | null) {
  return userId ? `${APPEARANCE_STORAGE_KEY}:${userId}` : APPEARANCE_STORAGE_KEY
}
