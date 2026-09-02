import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/env.dart';
import '../core/errors.dart';
import '../data/insights_api.dart';
import '../models/models.dart';
import '../state/auth_controller.dart';
import '../state/finance_controller.dart';
import '../state/insights_controller.dart';
import '../widgets/app_widgets.dart';
import '../widgets/vio_panel.dart';

class InsightsPage extends StatefulWidget {
  const InsightsPage({super.key});

  @override
  State<InsightsPage> createState() => _InsightsPageState();
}

class _InsightsPageState extends State<InsightsPage> with SingleTickerProviderStateMixin {
  late final TabController tabs;

  @override
  void initState() {
    super.initState();
    tabs = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  @override
  void dispose() {
    tabs.dispose();
    super.dispose();
  }

  Future<void> _load([DateRange? range]) async {
    final insights = context.read<InsightsController>();
    await insights.analyze(context.read<AuthController>(), context.read<FinanceController>(), range);
  }

  @override
  Widget build(BuildContext context) {
    final insights = context.watch<InsightsController>();
    final analysis = insights.analysis;
    return PageStack(
      children: [
        PageHeader(
          title: 'AI Financial Insights',
          description: 'Calculated from your transactions, then explained. Numbers never come from the model.',
          actions: DateRangePickerButton(
            value: insights.range,
            onChanged: (value) => _load(value),
          ),
        ),
        Text('Backend ${AppEnv.current.insightsApiUrl}', style: TextStyle(fontSize: 11, color: context.aureum.label)),
        if (insights.loading) const LinearProgressIndicator(),
        if (insights.error != null)
          ErrorState(
            title: 'Unable to load insights',
            description: toUserMessage(insights.error!),
            onRetry: _load,
          ),
        if (analysis != null) ...[
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('OVERVIEW', style: TextStyle(fontSize: 11, color: context.aureum.label)),
                const SizedBox(height: 6),
                Text(analysis.summary, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500)),
                const SizedBox(height: 6),
                Text(analysis.financialHealthSummary, style: TextStyle(color: context.aureum.label)),
                if (analysis.usedFallback)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(
                      'AI explanations unavailable. Showing calculated insights.',
                      style: TextStyle(fontSize: 12, color: context.aureum.label),
                    ),
                  ),
              ],
            ),
          ),
          TabBar(
            controller: tabs,
            tabs: const [
              Tab(text: 'Insights'),
              Tab(text: 'Ask Vio'),
            ],
          ),
          AnimatedBuilder(
            animation: tabs,
            builder: (context, _) {
              if (tabs.index == 1) {
                return const VioChatView(page: 'insights');
              }
              final featured = analysis.insights.take(5).toList();
              final supporting = analysis.insights.skip(5).take(5).toList();
              if (featured.isEmpty) {
                return const EmptyState(
                  icon: Icons.auto_awesome,
                  title: 'No insights yet',
                  description: 'Add income and expenses in this period to generate grounded financial insights.',
                );
              }
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  for (final item in featured) InsightCard(insight: item),
                  if (supporting.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text('Supporting', style: TextStyle(fontSize: 11, color: context.aureum.label)),
                    for (final item in supporting) InsightCard(insight: item),
                  ],
                ],
              );
            },
          ),
        ],
      ],
    );
  }
}

class InsightCard extends StatelessWidget {
  const InsightCard({super.key, required this.insight});

  final FinancialInsight insight;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 10),
      child: AppCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Chip(label: Text(insight.type), visualDensity: VisualDensity.compact),
                const SizedBox(width: 8),
                Text(insight.severity, style: TextStyle(fontSize: 12, color: context.aureum.label)),
              ],
            ),
            const SizedBox(height: 8),
            Text(insight.title, style: const TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 4),
            Text(insight.summary),
            if (insight.recommendation != null) ...[
              const SizedBox(height: 8),
              Text(insight.recommendation!, style: TextStyle(color: context.aureum.label)),
            ],
          ],
        ),
      ),
    );
  }
}
