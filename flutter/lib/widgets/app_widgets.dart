import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../core/dates.dart';
import '../core/palette.dart';
import '../models/models.dart';
import '../theme/aureum_theme.dart';
import '../theme/density.dart';
import 'financial_amount.dart';

export 'financial_amount.dart';

extension AureumContext on BuildContext {
  AureumColors get aureum => Theme.of(this).extension<AureumColors>() ?? AureumColors.light;
  DensityTokens get density => Theme.of(this).extension<DensityTokens>() ?? DensityTokens.comfortable;
}

void appHaptic([bool success = false]) {
  if (success) {
    HapticFeedback.mediumImpact();
  } else {
    HapticFeedback.selectionClick();
  }
}

class PageHeader extends StatelessWidget {
  const PageHeader({super.key, required this.title, this.description, this.actions});

  final String title;
  final String? description;
  final Widget? actions;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(title, style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w600)),
            ),
            ?actions,
          ],
        ),
        if (description != null) ...[
          const SizedBox(height: 4),
          Text(description!, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: context.aureum.label)),
        ],
      ],
    );
  }
}

class EmptyState extends StatelessWidget {
  const EmptyState({
    super.key,
    required this.icon,
    required this.title,
    required this.description,
    this.action,
  });

  final IconData icon;
  final String title;
  final String description;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          children: [
            Icon(icon, size: 32, color: context.aureum.label),
            const SizedBox(height: 12),
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 6),
            Text(description, textAlign: TextAlign.center, style: TextStyle(color: context.aureum.label)),
            if (action != null) ...[const SizedBox(height: 16), action!],
          ],
        ),
      ),
    );
  }
}

class ErrorState extends StatelessWidget {
  const ErrorState({super.key, required this.title, required this.description, this.onRetry});

  final String title;
  final String description;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    return EmptyState(
      icon: Icons.error_outline,
      title: title,
      description: description,
      action: onRetry == null ? null : FilledButton(onPressed: onRetry, child: const Text('Retry')),
    );
  }
}

class CurrencyText extends StatelessWidget {
  const CurrencyText({
    super.key,
    required this.amount,
    required this.currency,
    this.tone,
    this.style,
    this.compact = false,
    this.sign = false,
  });

  final double amount;
  final String currency;
  final String? tone;
  final TextStyle? style;
  final bool compact;
  final bool sign;

  @override
  Widget build(BuildContext context) {
    return FinancialAmount(
      amount: amount,
      currency: currency,
      tone: tone,
      style: style,
      compact: compact,
      sign: sign,
    );
  }
}

class SectionHeader extends StatelessWidget {
  const SectionHeader({super.key, required this.title, this.actionLabel, this.onAction});

  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(child: Text(title, style: Theme.of(context).textTheme.titleMedium)),
        if (actionLabel != null)
          TextButton(onPressed: onAction, child: Text(actionLabel!)),
      ],
    );
  }
}

class MetricTile extends StatelessWidget {
  const MetricTile({
    super.key,
    required this.label,
    required this.amount,
    required this.currency,
    this.tone,
    this.change,
    this.invertChange = false,
  });

  final String label;
  final double amount;
  final String currency;
  final String? tone;
  final double? change;
  final bool invertChange;

  @override
  Widget build(BuildContext context) {
    final good = change == null || change == 0
        ? null
        : invertChange
            ? change! < 0
            : change! > 0;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: Theme.of(context).textTheme.bodySmall),
        const SizedBox(height: 4),
        FinancialAmount(
          amount: amount,
          currency: currency,
          tone: tone,
          style: Theme.of(context).textTheme.titleMedium,
        ),
        if (change != null)
          Text(
            '${change! > 0 ? '+' : ''}${change!.toStringAsFixed(1)}%',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: good == null
                      ? context.aureum.label
                      : good
                          ? context.aureum.income
                          : context.aureum.expense,
                ),
          ),
      ],
    );
  }
}

class BudgetProgressTile extends StatelessWidget {
  const BudgetProgressTile({
    super.key,
    required this.name,
    required this.spent,
    required this.limit,
    required this.currency,
    this.alertThreshold = 80,
    this.onTap,
  });

  final String name;
  final double spent;
  final double limit;
  final String currency;
  final double alertThreshold;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final percent = limit <= 0 ? 0.0 : (spent / limit) * 100;
    final tone = percent >= 100 ? 'danger' : percent >= alertThreshold ? 'warning' : 'default';
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: context.density.rowPadding,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(child: Text(name, overflow: TextOverflow.ellipsis, style: Theme.of(context).textTheme.titleSmall)),
                Text(
                  '${percent.toStringAsFixed(0)}%',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
            const SizedBox(height: 6),
            UsageBar(value: percent, tone: tone),
          ],
        ),
      ),
    );
  }
}

class LoadingState extends StatelessWidget {
  const LoadingState({super.key});

  @override
  Widget build(BuildContext context) {
    final fill = Theme.of(context).colorScheme.outline.withValues(alpha: 0.16);
    Widget bar([double width = 120]) => Container(
          height: 14,
          width: width,
          decoration: BoxDecoration(color: fill, borderRadius: BorderRadius.circular(8)),
        );
    return Padding(
      padding: context.density.pagePadding,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          bar(160),
          SizedBox(height: context.density.gap),
          AppCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [bar(80), const SizedBox(height: 12), bar(200)])),
          SizedBox(height: context.density.sectionGap),
          Row(
            children: [
              Expanded(child: AppCard(child: bar(90))),
              SizedBox(width: context.density.gap),
              Expanded(child: AppCard(child: bar(90))),
            ],
          ),
        ],
      ),
    );
  }
}

class BrandMark extends StatelessWidget {
  const BrandMark({super.key, this.size = 56});

  final double size;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return Image.asset(
      dark ? 'assets/brand/logo_dark.png' : 'assets/brand/logo_light.png',
      width: size,
      height: size,
      filterQuality: FilterQuality.medium,
      semanticLabel: 'Aureum',
    );
  }
}

class CategoryGlyph extends StatelessWidget {
  const CategoryGlyph({super.key, required this.name, this.color, this.size = 36});

  final String name;
  final String? color;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: parseHex(color ?? '#8B5CF6').withValues(alpha: 0.16),
        borderRadius: BorderRadius.circular(size / 2.4),
      ),
      child: Icon(iconFor(name), size: size * 0.48, color: parseHex(color ?? '#8B5CF6')),
    );
  }
}

IconData iconFor(String name) {
  return switch (name) {
    'UtensilsCrossed' => Icons.restaurant,
    'Car' => Icons.directions_car_outlined,
    'ShoppingBag' => Icons.shopping_bag_outlined,
    'Receipt' => Icons.receipt_long_outlined,
    'Clapperboard' => Icons.movie_outlined,
    'HeartPulse' => Icons.favorite_outline,
    'GraduationCap' => Icons.school_outlined,
    'Plane' => Icons.flight_outlined,
    'House' => Icons.home_outlined,
    'Briefcase' => Icons.work_outline,
    'Laptop' => Icons.laptop_mac,
    'Building2' => Icons.apartment,
    'TrendingUp' => Icons.trending_up,
    'Gift' => Icons.card_giftcard,
    'Coffee' => Icons.coffee_outlined,
    'Fuel' => Icons.local_gas_station_outlined,
    'Smartphone' => Icons.smartphone,
    'Shirt' => Icons.checkroom,
    'Dumbbell' => Icons.fitness_center,
    'PawPrint' => Icons.pets,
    'Baby' => Icons.child_care,
    'Music' => Icons.music_note,
    'Gamepad2' => Icons.sports_esports_outlined,
    'Wallet' => Icons.wallet_outlined,
    'Landmark' => Icons.account_balance_outlined,
    'CreditCard' => Icons.credit_card,
    'PiggyBank' => Icons.savings_outlined,
    'Banknote' => Icons.payments_outlined,
    'Target' => Icons.flag_outlined,
    'Shield' => Icons.shield_outlined,
    _ => Icons.more_horiz,
  };
}

class TransactionRow extends StatelessWidget {
  const TransactionRow({
    super.key,
    required this.merchant,
    required this.meta,
    required this.amount,
    required this.currency,
    this.icon,
    this.color,
    this.tone,
    this.onTap,
  });

  final String merchant;
  final String meta;
  final double amount;
  final String currency;
  final String? icon;
  final String? color;
  final String? tone;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: context.density.rowPadding,
        child: Row(
          children: [
            CategoryGlyph(name: icon ?? 'CircleEllipsis', color: color, size: 36),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(merchant, overflow: TextOverflow.ellipsis, style: Theme.of(context).textTheme.titleSmall),
                  Text(meta, overflow: TextOverflow.ellipsis, style: Theme.of(context).textTheme.bodySmall),
                ],
              ),
            ),
            const SizedBox(width: 8),
            FinancialAmount(amount: amount, currency: currency, tone: tone, style: Theme.of(context).textTheme.titleSmall),
          ],
        ),
      ),
    );
  }
}

class DateRangePickerButton extends StatelessWidget {
  const DateRangePickerButton({super.key, required this.value, required this.onChanged});

  final DateRange value;
  final ValueChanged<DateRange> onChanged;

  @override
  Widget build(BuildContext context) {
    return OutlinedButton(
      onPressed: () async {
        final selected = await showModalBottomSheet<DateRange>(
          context: context,
          showDragHandle: true,
          builder: (context) {
            return SafeArea(
              child: ListView(
                shrinkWrap: true,
                children: [
                  for (final range in presetRanges())
                    ListTile(
                      title: Text(range.label),
                      subtitle: Text('${formatDate(range.from)} – ${formatDate(range.to)}'),
                      onTap: () => Navigator.pop(context, range),
                    ),
                ],
              ),
            );
          },
        );
        if (selected != null) onChanged(selected);
      },
      child: Text(value.label, overflow: TextOverflow.ellipsis),
    );
  }
}

class ConfirmDialog {
  static Future<bool> show(
    BuildContext context, {
    required String title,
    required String description,
    String confirmLabel = 'Confirm',
    bool destructive = false,
  }) async {
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(description),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(
            style: destructive ? FilledButton.styleFrom(backgroundColor: Theme.of(context).colorScheme.error) : null,
            onPressed: () => Navigator.pop(context, true),
            child: Text(confirmLabel),
          ),
        ],
      ),
    );
    return result ?? false;
  }
}

class AppCard extends StatelessWidget {
  const AppCard({super.key, required this.child, this.padding});

  final Widget child;
  final EdgeInsets? padding;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(padding: padding ?? EdgeInsets.all(context.density.cardPadding), child: child),
    );
  }
}

class FieldLabel extends StatelessWidget {
  const FieldLabel(this.text, {super.key});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(text, style: Theme.of(context).textTheme.labelMedium),
    );
  }
}

class UsageBar extends StatelessWidget {
  const UsageBar({super.key, required this.value, this.tone = 'default'});

  final double value;
  final String tone;

  @override
  Widget build(BuildContext context) {
    final color = switch (tone) {
      'danger' => context.aureum.expense,
      'warning' => context.aureum.warning,
      _ => Theme.of(context).colorScheme.primary,
    };
    return ClipRRect(
      borderRadius: BorderRadius.circular(99),
      child: LinearProgressIndicator(
        value: (value / 100).clamp(0, 1),
        minHeight: 6,
        color: color,
        backgroundColor: Theme.of(context).colorScheme.outline.withValues(alpha: 0.24),
      ),
    );
  }
}

class PageStack extends StatelessWidget {
  const PageStack({super.key, required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final density = context.density;
    return ListView(
      padding: density.pagePadding,
      children: [
        for (var i = 0; i < children.length; i++) ...[
          if (i > 0) SizedBox(height: density.sectionGap),
          children[i],
        ],
      ],
    );
  }
}

class ChoiceChips<T> extends StatelessWidget {
  const ChoiceChips({
    super.key,
    required this.value,
    required this.options,
    required this.onChanged,
  });

  final T value;
  final List<(T, String)> options;
  final ValueChanged<T> onChanged;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final option in options)
          ChoiceChip(
            label: Text(option.$2),
            selected: value == option.$1,
            onSelected: (_) => onChanged(option.$1),
          ),
      ],
    );
  }
}

void showSnack(BuildContext context, String message, {bool error = false}) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(message),
      backgroundColor: error ? Theme.of(context).colorScheme.error : null,
    ),
  );
}

T? watchOrNull<T>(BuildContext context) {
  try {
    return context.watch<T>();
  } catch (_) {
    return null;
  }
}
