import 'package:flutter/material.dart';

class DensityTokens extends ThemeExtension<DensityTokens> {
  const DensityTokens({
    required this.pagePadding,
    required this.cardPadding,
    required this.gap,
    required this.sectionGap,
    required this.rowPadding,
  });

  final EdgeInsets pagePadding;
  final double cardPadding;
  final double gap;
  final double sectionGap;
  final EdgeInsets rowPadding;

  static const compact = DensityTokens(
    pagePadding: EdgeInsets.fromLTRB(16, 8, 16, 20),
    cardPadding: 12,
    gap: 8,
    sectionGap: 14,
    rowPadding: EdgeInsets.symmetric(vertical: 8),
  );

  static const comfortable = DensityTokens(
    pagePadding: EdgeInsets.fromLTRB(16, 10, 16, 24),
    cardPadding: 16,
    gap: 10,
    sectionGap: 18,
    rowPadding: EdgeInsets.symmetric(vertical: 10),
  );

  static const spacious = DensityTokens(
    pagePadding: EdgeInsets.fromLTRB(20, 12, 20, 28),
    cardPadding: 20,
    gap: 14,
    sectionGap: 22,
    rowPadding: EdgeInsets.symmetric(vertical: 14),
  );

  factory DensityTokens.forName(String density) {
    return switch (density) {
      'compact' => compact,
      'spacious' => spacious,
      _ => comfortable,
    };
  }

  @override
  DensityTokens copyWith({
    EdgeInsets? pagePadding,
    double? cardPadding,
    double? gap,
    double? sectionGap,
    EdgeInsets? rowPadding,
  }) {
    return DensityTokens(
      pagePadding: pagePadding ?? this.pagePadding,
      cardPadding: cardPadding ?? this.cardPadding,
      gap: gap ?? this.gap,
      sectionGap: sectionGap ?? this.sectionGap,
      rowPadding: rowPadding ?? this.rowPadding,
    );
  }

  @override
  DensityTokens lerp(ThemeExtension<DensityTokens>? other, double t) {
    if (other is! DensityTokens) return this;
    return DensityTokens(
      pagePadding: EdgeInsets.lerp(pagePadding, other.pagePadding, t)!,
      cardPadding: lerpDouble(cardPadding, other.cardPadding, t)!,
      gap: lerpDouble(gap, other.gap, t)!,
      sectionGap: lerpDouble(sectionGap, other.sectionGap, t)!,
      rowPadding: EdgeInsets.lerp(rowPadding, other.rowPadding, t)!,
    );
  }
}

double? lerpDouble(double a, double b, double t) => a + (b - a) * t;
