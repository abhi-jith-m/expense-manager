import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../core/nav.dart';
import '../core/vio_prompts.dart';
import '../state/auth_controller.dart';
import '../state/finance_controller.dart';
import '../widgets/app_widgets.dart';
import '../widgets/vio_panel.dart';

class AppShell extends StatelessWidget {
  const AppShell({super.key, required this.child});

  final Widget child;

  static const _titles = {
    '/': '',
    '/transactions': 'Transactions',
    '/analytics': 'Analytics',
    '/budgets': 'Budgets',
    '/more': 'More',
    '/expenses': 'Add expense',
    '/income': 'Income',
    '/insights': 'Insights',
    '/categories': 'Categories',
    '/accounts': 'Accounts',
    '/reports': 'Reports',
    '/import-export': 'Import / Export',
    '/recurring': 'Recurring',
    '/goals': 'Goals',
    '/notifications': 'Notifications',
    '/settings': 'Settings',
    '/profile': 'Profile',
  };

  @override
  Widget build(BuildContext context) {
    final wide = MediaQuery.sizeOf(context).width >= 840;
    final location = GoRouterState.of(context).uri.path;
    final primary = primaryDestinations.contains(location);
    final tabIndex = mobileTabs.indexWhere((item) => item.to == location);
    final greeting = _greeting();
    final name = context.watch<AuthController>().user?.fullName.split(' ').first;

    return PopScope(
      canPop: location == '/' && !Navigator.of(context).canPop(),
      onPopInvokedWithResult: (didPop, _) {
        if (didPop) return;
        if (context.canPop()) {
          context.pop();
          return;
        }
        if (!primary) {
          context.go('/more');
          return;
        }
        if (location != '/') context.go('/');
      },
      child: Scaffold(
        appBar: AppBar(
          leading: primary
              ? null
              : IconButton(
                  tooltip: 'Back',
                  onPressed: () {
                    if (context.canPop()) {
                      context.pop();
                    } else {
                      context.go('/more');
                    }
                  },
                  icon: const Icon(Icons.arrow_back),
                ),
          title: location == '/'
              ? Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(greeting, style: Theme.of(context).textTheme.titleLarge),
                    Text(
                      name == null ? 'Your finances' : 'Hi, $name',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                )
              : Text(_titles[location] ?? 'Aureum'),
          actions: [
            IconButton(
              tooltip: 'Ask Vio',
              onPressed: () => openVioSheet(context, page: vioPageId(location)),
              icon: const Icon(Icons.auto_awesome),
            ),
            IconButton(
              tooltip: 'Notifications',
              onPressed: () => context.push('/notifications'),
              icon: const Icon(Icons.notifications_none),
            ),
          ],
        ),
        body: Row(
          children: [
            if (wide)
              NavigationRail(
                selectedIndex: tabIndex < 0 ? 4 : tabIndex,
                onDestinationSelected: (value) => context.go(mobileTabs[value].to),
                labelType: NavigationRailLabelType.all,
                destinations: [
                  for (final item in mobileTabs)
                    NavigationRailDestination(icon: Icon(item.icon), label: Text(item.label)),
                ],
              ),
            Expanded(child: child),
          ],
        ),
        bottomNavigationBar: wide
            ? null
            : NavigationBar(
                selectedIndex: tabIndex < 0 ? 4 : tabIndex,
                onDestinationSelected: (value) => context.go(mobileTabs[value].to),
                destinations: [
                  for (final item in mobileTabs)
                    NavigationDestination(icon: Icon(item.icon), selectedIcon: Icon(item.icon), label: item.label),
                ],
              ),
        floatingActionButton: location == '/' || location == '/transactions'
            ? FloatingActionButton(
                tooltip: 'Add expense',
                onPressed: () => context.push('/expenses'),
                child: const Icon(Icons.add),
              )
            : null,
      ),
    );
  }

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }
}

class SplashPage extends StatelessWidget {
  const SplashPage({super.key});

  @override
  Widget build(BuildContext context) {
    final finance = context.watch<FinanceController>();
    if (!finance.loading && finance.accounts.isEmpty && finance.transactions.isEmpty && finance.categories.isEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (context.mounted) finance.refresh();
      });
    }
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const BrandMark(size: 88),
              const SizedBox(height: 20),
              Text('Aureum', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 8),
              Text(
                'Your finances, beautifully organized.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: context.aureum.label),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
