import { describe, expect, it } from 'vitest'
import { DEFAULT_APPEARANCE, parseAppearance } from '@/lib/appearance'

describe('parseAppearance', () => {
  it('returns defaults for invalid input', () => {
    expect(parseAppearance(null)).toEqual(DEFAULT_APPEARANCE)
  })

  it('keeps valid values and drops unknown ones', () => {
    const parsed = parseAppearance({
      theme: 'light',
      accent: 'blue',
      density: 'compact',
      textSize: 'large',
      typography: 'data',
      cornerStyle: 'sharp',
      interfaceStyle: 'minimal',
      motion: 'reduced',
      preset: 'ocean',
    })
    expect(parsed.theme).toBe('light')
    expect(parsed.accent).toBe('blue')
    expect(parsed.density).toBe('compact')
    expect(parsed.textSize).toBe('large')
    expect(parsed.preset).toBe('ocean')
    expect(parsed.cornerStyle).toBe('sharp')
    expect(parsed.typography).toBe('data')
  })

  it('defaults corner style to soft', () => {
    expect(parseAppearance({}).cornerStyle).toBe('soft')
  })
})
