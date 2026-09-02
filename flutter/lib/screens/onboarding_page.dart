import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/currency.dart';
import '../core/dates.dart';
import '../core/errors.dart';
import '../state/auth_controller.dart';
import '../state/finance_controller.dart';
import '../widgets/app_widgets.dart';

const _steps = ['Welcome', 'Profile', 'Account', 'Budget', 'Ready'];

class OnboardingPage extends StatefulWidget {
  const OnboardingPage({super.key});

  @override
  State<OnboardingPage> createState() => _OnboardingPageState();
}

class _OnboardingPageState extends State<OnboardingPage> {
  int step = 0;
  late final TextEditingController fullName;
  late String currency;
  final accountName = TextEditingController(text: 'Everyday account');
  String accountType = 'bank';
  final openingBalance = TextEditingController(text: '0');
  final budgetLimit = TextEditingController(text: '1500');
  bool saving = false;

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthController>().user;
    fullName = TextEditingController(text: user?.fullName ?? '');
    currency = user?.currency ?? 'USD';
  }

  @override
  void dispose() {
    fullName.dispose();
    accountName.dispose();
    openingBalance.dispose();
    budgetLimit.dispose();
    super.dispose();
  }

  Future<void> finish({required bool skipRest}) async {
    setState(() => saving = true);
    final auth = context.read<AuthController>();
    try {
      await auth.client.updateProfile({
        'fullName': fullName.text,
        'currency': currency,
        'onboardingCompleted': true,
      });
      if (!skipRest) {
        await auth.client.createAccount({
          'name': accountName.text,
          'type': accountType,
          'openingBalance': double.tryParse(openingBalance.text) ?? 0,
          'currency': currency,
          'icon': 'Landmark',
          'color': '#3B82F6',
          'status': 'active',
        });
        final limit = double.tryParse(budgetLimit.text) ?? 0;
        if (limit > 0) {
          await auth.client.createBudget({
            'name': 'Overall monthly',
            'categoryId': null,
            'limitAmount': limit,
            'period': 'monthly',
            'startDate': toISODate(DateTime.now()),
            'endDate': null,
            'alertThreshold': 80,
          });
        }
      }
      await auth.refresh();
      if (!mounted) return;
      await context.read<FinanceController>().refresh();
      if (!mounted) return;
      context.go('/');
    } catch (error) {
      if (mounted) showSnack(context, toUserMessage(error), error: true);
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Step ${step + 1} of ${_steps.length}', style: TextStyle(color: context.aureum.label, fontSize: 12)),
              const SizedBox(height: 8),
              Text(_steps[step], style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w600)),
              const SizedBox(height: 24),
              Expanded(child: _body()),
            ],
          ),
        ),
      ),
    );
  }

  Widget _body() {
    switch (step) {
      case 0:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Aureum keeps income, expenses, budgets, and goals in one place. We’ll set a default currency and your first account.',
              style: TextStyle(color: context.aureum.label),
            ),
            const SizedBox(height: 20),
            FilledButton(onPressed: () => setState(() => step = 1), child: const Text('Get started')),
          ],
        );
      case 1:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(controller: fullName, decoration: const InputDecoration(labelText: 'What should we call you?')),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: currency,
              decoration: const InputDecoration(labelText: 'Default currency'),
              items: [for (final item in currencies) DropdownMenuItem(value: item.code, child: Text('${item.code} · ${item.name}'))],
              onChanged: (value) => setState(() => currency = value ?? currency),
            ),
            const SizedBox(height: 8),
            Text('Aureum does not convert between currencies.', style: TextStyle(color: context.aureum.label, fontSize: 12)),
            const SizedBox(height: 20),
            FilledButton(onPressed: () => setState(() => step = 2), child: const Text('Continue')),
          ],
        );
      case 2:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(controller: accountName, decoration: const InputDecoration(labelText: 'First account')),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: accountType,
              decoration: const InputDecoration(labelText: 'Account type'),
              items: const [
                DropdownMenuItem(value: 'cash', child: Text('Cash')),
                DropdownMenuItem(value: 'bank', child: Text('Bank')),
                DropdownMenuItem(value: 'credit', child: Text('Credit card')),
                DropdownMenuItem(value: 'savings', child: Text('Savings')),
                DropdownMenuItem(value: 'wallet', child: Text('Digital wallet')),
              ],
              onChanged: (value) => setState(() => accountType = value ?? accountType),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: openingBalance,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(labelText: 'Opening balance'),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                FilledButton(onPressed: () => setState(() => step = 3), child: const Text('Continue')),
                const SizedBox(width: 8),
                TextButton(onPressed: () => finish(skipRest: true), child: const Text('Skip remaining')),
              ],
            ),
          ],
        );
      case 3:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(
              controller: budgetLimit,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(labelText: 'Monthly spending limit (optional)'),
            ),
            const SizedBox(height: 20),
            FilledButton(onPressed: () => setState(() => step = 4), child: const Text('Continue')),
          ],
        );
      default:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'You’re ready. Add a first expense from the dashboard, or import a bank CSV later.',
              style: TextStyle(color: context.aureum.label),
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: saving ? null : () => finish(skipRest: false),
              child: Text(saving ? 'Saving…' : 'Go to dashboard'),
            ),
          ],
        );
    }
  }
}
