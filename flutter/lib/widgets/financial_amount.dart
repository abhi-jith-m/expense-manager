import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../core/currency.dart';
import 'app_widgets.dart';

class FinancialAmount extends StatelessWidget {
  const FinancialAmount({
    super.key,
    required this.amount,
    required this.currency,
    this.tone,
    this.style,
    this.compact = false,
    this.sign = false,
    this.maxLines = 1,
  });

  final double amount;
  final String currency;
  final String? tone;
  final TextStyle? style;
  final bool compact;
  final bool sign;
  final int maxLines;

  @override
  Widget build(BuildContext context) {
    final colors = context.aureum;
    final color = switch (tone) {
      'income' => colors.income,
      'expense' => colors.expense,
      'savings' || 'transfer' => colors.savings,
      'warning' => colors.warning,
      _ => style?.color,
    };
    final text = formatMoney(amount, currencyCode: currency, sign: sign || tone != null, compact: compact);
    final resolved = GoogleFonts.jetBrainsMono(
      textStyle: (style ?? Theme.of(context).textTheme.bodyMedium)?.copyWith(
        color: color,
        fontFeatures: const [FontFeature.tabularFigures()],
      ),
    );
    return FittedBox(
      fit: BoxFit.scaleDown,
      alignment: Alignment.centerLeft,
      child: Text(text, maxLines: maxLines, overflow: TextOverflow.ellipsis, style: resolved),
    );
  }
}
