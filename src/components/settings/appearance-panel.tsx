import { CurrencyDisplay } from '@/components/shared/currency-display'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useAppearance } from '@/contexts/appearance-context'
import { ACCENTS, PRESETS, type AppearancePreferences } from '@/lib/appearance'
import { cn } from '@/lib/utils'

const ACCENT_SWATCH: Record<string, string> = {
  violet: '#8B5CF6',
  purple: '#A855F7',
  indigo: '#6366F1',
  blue: '#3B82F6',
  cyan: '#22D3EE',
  pink: '#EC4899',
  rose: '#F43F5E',
}

function ChoiceGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: Array<{ id: T; label: string }>
  onChange: (value: T) => void
}) {
  return (
    <div className="space-y-2">
      <Label className="text-ui-sm text-muted-foreground">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              'min-h-11 rounded-[var(--radius-md)] border px-3 text-sm font-medium',
              value === option.id ? 'border-primary bg-primary/12 text-foreground' : 'border-border text-muted-foreground',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function AppearancePanel() {
  const { appearance, updateAppearance } = useAppearance()

  function set<K extends keyof AppearancePreferences>(key: K, value: AppearancePreferences[K]) {
    updateAppearance({ [key]: value })
  }

  return (
    <Card>
      <CardContent className="space-y-5">
        <div>
          <p className="text-ui-md font-semibold">Appearance</p>
          <p className="text-ui-sm text-muted-foreground">Theme, type, and spacing. Changes apply immediately.</p>
        </div>

        <ChoiceGroup
          label="Theme"
          value={appearance.theme}
          onChange={(value) => set('theme', value)}
          options={[
            { id: 'system', label: 'System' },
            { id: 'light', label: 'Light' },
            { id: 'dark', label: 'Dark' },
          ]}
        />

        <div className="space-y-2">
          <Label className="text-ui-sm text-muted-foreground">Preset</Label>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => set('preset', preset.id)}
                className={cn(
                  'min-h-11 rounded-[var(--radius-md)] border px-3 text-sm font-medium',
                  appearance.preset === preset.id
                    ? 'border-primary bg-primary/12 text-foreground'
                    : 'border-border text-muted-foreground',
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-ui-sm text-muted-foreground">Accent</Label>
          <div className="flex flex-wrap gap-2">
            {ACCENTS.map((accent) => (
              <button
                key={accent}
                type="button"
                aria-label={accent}
                onClick={() => set('accent', accent)}
                className={cn(
                  'size-11 rounded-full border-2',
                  appearance.accent === accent ? 'border-foreground' : 'border-transparent',
                )}
                style={{ background: ACCENT_SWATCH[accent] }}
              />
            ))}
          </div>
        </div>

        <ChoiceGroup
          label="Density"
          value={appearance.density}
          onChange={(value) => set('density', value)}
          options={[
            { id: 'compact', label: 'Compact' },
            { id: 'comfortable', label: 'Comfortable' },
            { id: 'spacious', label: 'Spacious' },
          ]}
        />

        <ChoiceGroup
          label="Text size"
          value={appearance.textSize}
          onChange={(value) => set('textSize', value)}
          options={[
            { id: 'small', label: 'Small' },
            { id: 'default', label: 'Default' },
            { id: 'large', label: 'Large' },
          ]}
        />

        <ChoiceGroup
          label="Typography"
          value={appearance.typography}
          onChange={(value) => set('typography', value)}
          options={[
            { id: 'modern', label: 'Modern' },
            { id: 'system', label: 'System' },
            { id: 'data', label: 'Data' },
          ]}
        />

        <ChoiceGroup
          label="Corners"
          value={appearance.cornerStyle}
          onChange={(value) => set('cornerStyle', value)}
          options={[
            { id: 'sharp', label: 'Sharp' },
            { id: 'soft', label: 'Soft' },
            { id: 'rounded', label: 'Rounded' },
          ]}
        />

        <ChoiceGroup
          label="Interface"
          value={appearance.interfaceStyle}
          onChange={(value) => set('interfaceStyle', value)}
          options={[
            { id: 'minimal', label: 'Minimal' },
            { id: 'balanced', label: 'Balanced' },
            { id: 'expressive', label: 'Expressive' },
          ]}
        />

        <ChoiceGroup
          label="Motion"
          value={appearance.motion}
          onChange={(value) => set('motion', value)}
          options={[
            { id: 'full', label: 'Full' },
            { id: 'reduced', label: 'Reduced' },
          ]}
        />

        <div className="space-y-2">
          <Label className="text-ui-sm text-muted-foreground">Preview</Label>
          <div className="rounded-[var(--radius)] border border-border bg-background p-[var(--card-pad)]">
            <p className="text-label">Total balance</p>
            <CurrencyDisplay amount={82450} currency="INR" className="text-kpi mt-1 block" />
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="min-w-0">
                <p className="text-label">Income</p>
                <CurrencyDisplay amount={45000} currency="INR" className="block text-base font-semibold" />
              </div>
              <div className="min-w-0">
                <p className="text-label">Expenses</p>
                <CurrencyDisplay amount={24500} currency="INR" className="block text-base font-semibold" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
