import 'package:flutter/material.dart';

class ChartColors {
  const ChartColors._();

  static const income = Color(0xFF7C3AED);
  static const expenses = Color(0xFFE11D48);
  static const savings = Color(0xFF0891B2);
  static const investments = Color(0xFF2563EB);
  static const bills = Color(0xFF22D3EE);
  static const food = Color(0xFF8B5CF6);
  static const transport = Color(0xFF3B82F6);
  static const shopping = Color(0xFFEC4899);
  static const entertainment = Color(0xFFA855F7);
  static const health = Color(0xFFF43F5E);
  static const travel = Color(0xFF6366F1);
  static const other = Color(0xFF94A3B8);
  static const info = Color(0xFF2563EB);
  static const warning = Color(0xFFD97706);
}

const categoryPalette = [
  Color(0xFF8B5CF6),
  Color(0xFFA855F7),
  Color(0xFF6366F1),
  Color(0xFF3B82F6),
  Color(0xFF22D3EE),
  Color(0xFFEC4899),
  Color(0xFFF43F5E),
  Color(0xFFF59E0B),
  Color(0xFF94A3B8),
];

Color parseHex(String hex, [Color fallback = ChartColors.other]) {
  final cleaned = hex.replaceFirst('#', '');
  if (cleaned.length != 6 && cleaned.length != 8) return fallback;
  final value = int.tryParse(cleaned, radix: 16);
  if (value == null) return fallback;
  return Color(cleaned.length == 6 ? 0xFF000000 | value : value);
}

Color categoryColor(String name, [Color? fallback]) {
  const map = {
    'Food': ChartColors.food,
    'Transport': ChartColors.transport,
    'Shopping': ChartColors.shopping,
    'Bills': ChartColors.bills,
    'Entertainment': ChartColors.entertainment,
    'Health': ChartColors.health,
    'Education': ChartColors.travel,
    'Travel': ChartColors.travel,
    'Housing': ChartColors.entertainment,
    'Other': ChartColors.other,
    'Salary': ChartColors.income,
    'Freelance': ChartColors.savings,
    'Business': ChartColors.investments,
    'Investments': ChartColors.investments,
    'Gifts': ChartColors.shopping,
    'Other income': ChartColors.other,
  };
  return fallback ?? map[name] ?? ChartColors.other;
}

const accentSwatch = {
  'violet': Color(0xFF8B5CF6),
  'purple': Color(0xFFA855F7),
  'indigo': Color(0xFF6366F1),
  'blue': Color(0xFF3B82F6),
  'cyan': Color(0xFF22D3EE),
  'pink': Color(0xFFEC4899),
  'rose': Color(0xFFF43F5E),
};
