import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../core/appearance.dart';
import '../core/palette.dart';
import 'density.dart';

class AureumColors extends ThemeExtension<AureumColors> {
  const AureumColors({
    required this.income,
    required this.expense,
    required this.savings,
    required this.investment,
    required this.budget,
    required this.surfaceSecondary,
    required this.sidebar,
    required this.sidebarMuted,
    required this.label,
    required this.cardHover,
    required this.warning,
    required this.mono,
  });

  final Color income;
  final Color expense;
  final Color savings;
  final Color investment;
  final Color budget;
  final Color surfaceSecondary;
  final Color sidebar;
  final Color sidebarMuted;
  final Color label;
  final Color cardHover;
  final Color warning;
  final TextStyle mono;

  static const light = AureumColors(
    income: Color(0xFF7C3AED),
    expense: Color(0xFFE11D48),
    savings: Color(0xFF0891B2),
    investment: Color(0xFF2563EB),
    budget: Color(0xFF9333EA),
    surfaceSecondary: Color(0xFFF0EEF7),
    sidebar: Color(0xFFF0EEF7),
    sidebarMuted: Color(0xFF8B8498),
    label: Color(0xFF625B6F),
    cardHover: Color(0xFFFAF9FD),
    warning: Color(0xFFD97706),
    mono: TextStyle(fontFamily: 'JetBrains Mono', fontFeatures: [FontFeature.tabularFigures()]),
  );

  static const dark = AureumColors(
    income: Color(0xFFA78BFA),
    expense: Color(0xFFFB7185),
    savings: Color(0xFF22D3EE),
    investment: Color(0xFF3B82F6),
    budget: Color(0xFFA855F7),
    surfaceSecondary: Color(0xFF12101A),
    sidebar: Color(0xFF0C0A12),
    sidebarMuted: Color(0xFF756F83),
    label: Color(0xFFAAA4B8),
    cardHover: Color(0xFF1C1928),
    warning: Color(0xFFF59E0B),
    mono: TextStyle(fontFamily: 'JetBrains Mono', fontFeatures: [FontFeature.tabularFigures()]),
  );

  @override
  AureumColors copyWith({
    Color? income,
    Color? expense,
    Color? savings,
    Color? investment,
    Color? budget,
    Color? surfaceSecondary,
    Color? sidebar,
    Color? sidebarMuted,
    Color? label,
    Color? cardHover,
    Color? warning,
    TextStyle? mono,
  }) {
    return AureumColors(
      income: income ?? this.income,
      expense: expense ?? this.expense,
      savings: savings ?? this.savings,
      investment: investment ?? this.investment,
      budget: budget ?? this.budget,
      surfaceSecondary: surfaceSecondary ?? this.surfaceSecondary,
      sidebar: sidebar ?? this.sidebar,
      sidebarMuted: sidebarMuted ?? this.sidebarMuted,
      label: label ?? this.label,
      cardHover: cardHover ?? this.cardHover,
      warning: warning ?? this.warning,
      mono: mono ?? this.mono,
    );
  }

  @override
  AureumColors lerp(ThemeExtension<AureumColors>? other, double t) {
    if (other is! AureumColors) return this;
    return AureumColors(
      income: Color.lerp(income, other.income, t)!,
      expense: Color.lerp(expense, other.expense, t)!,
      savings: Color.lerp(savings, other.savings, t)!,
      investment: Color.lerp(investment, other.investment, t)!,
      budget: Color.lerp(budget, other.budget, t)!,
      surfaceSecondary: Color.lerp(surfaceSecondary, other.surfaceSecondary, t)!,
      sidebar: Color.lerp(sidebar, other.sidebar, t)!,
      sidebarMuted: Color.lerp(sidebarMuted, other.sidebarMuted, t)!,
      label: Color.lerp(label, other.label, t)!,
      cardHover: Color.lerp(cardHover, other.cardHover, t)!,
      warning: Color.lerp(warning, other.warning, t)!,
      mono: TextStyle.lerp(mono, other.mono, t)!,
    );
  }
}

class AureumTheme {
  static const lightBackground = Color(0xFFF7F6FB);
  static const darkBackground = Color(0xFF08070D);
  static const lightSurface = Color(0xFFFFFFFF);
  static const darkSurface = Color(0xFF12101A);
  static const lightText = Color(0xFF17131F);
  static const darkText = Color(0xFFF7F5FC);

  static ThemeData build({required Brightness brightness, required AppearancePreferences appearance}) {
    final isDark = brightness == Brightness.dark;
    final accent = accentSwatch[appearance.accent] ?? const Color(0xFF8B5CF6);
    final radiusValue = radius[appearance.cornerStyle] ?? 12;
    final scale = textScale[appearance.textSize] ?? 1.0;
    final extras = isDark ? AureumColors.dark : AureumColors.light;
    final density = DensityTokens.forName(appearance.density);

    final seed = ColorScheme.fromSeed(
      seedColor: accent,
      brightness: brightness,
      dynamicSchemeVariant: DynamicSchemeVariant.fidelity,
    );

    final scheme = seed.copyWith(
      primary: accent,
      onPrimary: const Color(0xFFF7F5FC),
      surface: isDark ? darkSurface : lightSurface,
      onSurface: isDark ? darkText : lightText,
      error: isDark ? const Color(0xFFF43F5E) : const Color(0xFFE11D48),
      outline: isDark ? const Color(0xFF292438) : const Color(0xFFE5E1EE),
      surfaceContainerHighest: isDark ? const Color(0xFF181522) : const Color(0xFFF0EEF7),
    );

    final baseUi = switch (appearance.typography) {
      'system' => ThemeData(brightness: brightness).textTheme,
      'data' => GoogleFonts.jetBrainsMonoTextTheme(),
      _ => GoogleFonts.interTextTheme(),
    };

    final textTheme = baseUi
        .apply(bodyColor: scheme.onSurface, displayColor: scheme.onSurface, fontSizeFactor: scale)
        .copyWith(
          displayLarge: baseUi.displayLarge?.copyWith(fontWeight: FontWeight.w600, fontSize: 32 * scale),
          headlineMedium: baseUi.headlineMedium?.copyWith(fontWeight: FontWeight.w600, fontSize: 24 * scale),
          titleLarge: baseUi.titleLarge?.copyWith(fontWeight: FontWeight.w600, fontSize: 20 * scale),
          titleMedium: baseUi.titleMedium?.copyWith(fontWeight: FontWeight.w600, fontSize: 16 * scale),
          bodyLarge: baseUi.bodyLarge?.copyWith(fontSize: 16 * scale, height: 1.4),
          bodyMedium: baseUi.bodyMedium?.copyWith(fontSize: 14 * scale, height: 1.4),
          bodySmall: baseUi.bodySmall?.copyWith(fontSize: 12 * scale, color: extras.label, height: 1.35),
          labelLarge: baseUi.labelLarge?.copyWith(fontWeight: FontWeight.w600, fontSize: 14 * scale),
          labelMedium: baseUi.labelMedium?.copyWith(fontSize: 12 * scale, letterSpacing: 0.2),
        );

    final overlay = SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: isDark ? Brightness.light : Brightness.dark,
      statusBarBrightness: isDark ? Brightness.dark : Brightness.light,
      systemNavigationBarColor: Colors.transparent,
      systemNavigationBarIconBrightness: isDark ? Brightness.light : Brightness.dark,
      systemNavigationBarContrastEnforced: false,
    );

    final shape = RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusValue));
    final inputRadius = BorderRadius.circular(radiusValue * 0.75);

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: scheme,
      scaffoldBackgroundColor: isDark ? darkBackground : lightBackground,
      textTheme: textTheme,
      visualDensity: appearance.density == 'compact'
          ? VisualDensity.compact
          : appearance.density == 'spacious'
              ? VisualDensity.comfortable
              : VisualDensity.standard,
      appBarTheme: AppBarTheme(
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        backgroundColor: isDark ? darkBackground : lightBackground,
        foregroundColor: scheme.onSurface,
        surfaceTintColor: Colors.transparent,
        systemOverlayStyle: overlay,
        titleTextStyle: textTheme.titleLarge,
      ),
      navigationBarTheme: NavigationBarThemeData(
        height: 72,
        elevation: 0,
        backgroundColor: isDark ? darkSurface : lightSurface,
        indicatorColor: accent.withValues(alpha: 0.16),
        labelTextStyle: WidgetStatePropertyAll(textTheme.labelMedium),
      ),
      navigationRailTheme: NavigationRailThemeData(
        backgroundColor: extras.sidebar,
        indicatorColor: accent.withValues(alpha: 0.16),
      ),
      cardTheme: CardThemeData(
        color: scheme.surface,
        elevation: isDark ? 0 : 0.5,
        shadowColor: const Color(0x1417131F),
        shape: shape,
        margin: EdgeInsets.zero,
      ),
      dialogTheme: DialogThemeData(shape: shape, backgroundColor: scheme.surface),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: scheme.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(radiusValue + 4))),
        showDragHandle: true,
      ),
      searchBarTheme: SearchBarThemeData(
        elevation: const WidgetStatePropertyAll(0),
        backgroundColor: WidgetStatePropertyAll(scheme.surfaceContainerHighest),
        shape: WidgetStatePropertyAll(shape),
      ),
      chipTheme: ChipThemeData(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusValue)),
        side: BorderSide(color: scheme.outline.withValues(alpha: 0.6)),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: isDark ? const Color(0xFF191622) : const Color(0xFFFAF9FC),
        border: OutlineInputBorder(borderRadius: inputRadius, borderSide: BorderSide(color: scheme.outline)),
        enabledBorder: OutlineInputBorder(borderRadius: inputRadius, borderSide: BorderSide(color: scheme.outline)),
        focusedBorder: OutlineInputBorder(
          borderRadius: inputRadius,
          borderSide: BorderSide(color: scheme.primary, width: 1.4),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size(48, 48),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusValue * 0.75)),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(48, 48),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusValue * 0.75)),
        ),
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: accent,
        foregroundColor: const Color(0xFFF7F5FC),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusValue)),
      ),
      snackBarTheme: SnackBarThemeData(behavior: SnackBarBehavior.floating, shape: shape),
      pageTransitionsTheme: const PageTransitionsTheme(
        builders: {
          TargetPlatform.android: PredictiveBackPageTransitionsBuilder(),
          TargetPlatform.linux: FadeUpwardsPageTransitionsBuilder(),
        },
      ),
      extensions: [extras, density],
    );
  }
}
