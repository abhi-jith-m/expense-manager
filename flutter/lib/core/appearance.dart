const accents = ['violet', 'purple', 'indigo', 'blue', 'cyan', 'pink', 'rose'];

class AppearancePreset {
  const AppearancePreset({required this.id, required this.label, required this.accent});

  final String id;
  final String label;
  final String accent;
}

const presets = [
  AppearancePreset(id: 'midnight', label: 'Midnight Violet', accent: 'violet'),
  AppearancePreset(id: 'royal', label: 'Royal Purple', accent: 'purple'),
  AppearancePreset(id: 'ocean', label: 'Ocean Blue', accent: 'blue'),
  AppearancePreset(id: 'electric', label: 'Electric Pink', accent: 'pink'),
];

class AppearancePreferences {
  const AppearancePreferences({
    required this.theme,
    required this.accent,
    required this.preset,
    required this.density,
    required this.textSize,
    required this.typography,
    required this.cornerStyle,
    required this.interfaceStyle,
    required this.motion,
  });

  final String theme;
  final String accent;
  final String preset;
  final String density;
  final String textSize;
  final String typography;
  final String cornerStyle;
  final String interfaceStyle;
  final String motion;

  AppearancePreferences copyWith({
    String? theme,
    String? accent,
    String? preset,
    String? density,
    String? textSize,
    String? typography,
    String? cornerStyle,
    String? interfaceStyle,
    String? motion,
  }) {
    return AppearancePreferences(
      theme: theme ?? this.theme,
      accent: accent ?? this.accent,
      preset: preset ?? this.preset,
      density: density ?? this.density,
      textSize: textSize ?? this.textSize,
      typography: typography ?? this.typography,
      cornerStyle: cornerStyle ?? this.cornerStyle,
      interfaceStyle: interfaceStyle ?? this.interfaceStyle,
      motion: motion ?? this.motion,
    );
  }

  Map<String, dynamic> toJson() => {
        'theme': theme,
        'accent': accent,
        'preset': preset,
        'density': density,
        'textSize': textSize,
        'typography': typography,
        'cornerStyle': cornerStyle,
        'interfaceStyle': interfaceStyle,
        'motion': motion,
      };
}

const defaultAppearance = AppearancePreferences(
  theme: 'system',
  accent: 'violet',
  preset: 'midnight',
  density: 'comfortable',
  textSize: 'default',
  typography: 'modern',
  cornerStyle: 'soft',
  interfaceStyle: 'balanced',
  motion: 'full',
);

const appearanceStorageKey = 'aureum-appearance';

const textScale = {'small': 0.92, 'default': 1.0, 'large': 1.08};
const radius = {'sharp': 8.0, 'soft': 12.0, 'rounded': 18.0};

AppearancePreferences parseAppearance(Object? raw) {
  if (raw is! Map) return defaultAppearance;
  final value = Map<String, dynamic>.from(raw);
  final theme = value['theme'];
  final accent = value['accent'];
  final preset = value['preset'];
  final density = value['density'];
  final textSize = value['textSize'];
  final typography = value['typography'];
  final cornerStyle = value['cornerStyle'];
  final interfaceStyle = value['interfaceStyle'];
  final motion = value['motion'];
  return AppearancePreferences(
    theme: theme == 'light' || theme == 'dark' || theme == 'system' ? theme as String : defaultAppearance.theme,
    accent: accents.contains(accent) ? accent as String : defaultAppearance.accent,
    preset: presets.any((item) => item.id == preset) ? preset as String : defaultAppearance.preset,
    density: density == 'compact' || density == 'spacious' ? density as String : 'comfortable',
    textSize: textSize == 'small' || textSize == 'large' ? textSize as String : 'default',
    typography: typography == 'system' || typography == 'data' ? typography as String : 'modern',
    cornerStyle: cornerStyle == 'rounded' || cornerStyle == 'sharp' ? cornerStyle as String : defaultAppearance.cornerStyle,
    interfaceStyle:
        interfaceStyle == 'minimal' || interfaceStyle == 'expressive' ? interfaceStyle as String : 'balanced',
    motion: motion == 'reduced' ? 'reduced' : 'full',
  );
}

String appearanceKey([String? userId]) => userId == null ? appearanceStorageKey : '$appearanceStorageKey:$userId';
