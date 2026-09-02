import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'screens/analysis_pages.dart';
import 'screens/app_shell.dart';
import 'screens/auth/auth_screens.dart';
import 'screens/dashboard_page.dart';
import 'screens/insights_page.dart';
import 'screens/money_pages.dart';
import 'screens/more_page.dart';
import 'screens/onboarding_page.dart';
import 'screens/organize_pages.dart';
import 'screens/planning_pages.dart';
import 'screens/settings_pages.dart';
import 'screens/transactions_page.dart';
import 'state/appearance_controller.dart';
import 'state/auth_controller.dart';
import 'state/finance_controller.dart';
import 'theme/aureum_theme.dart';

GoRouter createRouter(AuthController auth, FinanceController finance) {
  return GoRouter(
    initialLocation: '/splash',
    refreshListenable: auth,
    redirect: (context, state) {
      if (auth.loading) return state.matchedLocation == '/splash' ? null : '/splash';
      if (state.matchedLocation == '/splash') {
        return auth.session == null ? '/login' : ((auth.user?.onboardingCompleted ?? false) ? '/' : '/onboarding');
      }
      final loggedIn = auth.session != null;
      final loc = state.matchedLocation;
      const guest = {'/login', '/signup', '/forgot-password'};
      if (!loggedIn && loc != '/reset-password' && !guest.contains(loc)) return '/login';
      if (loggedIn && guest.contains(loc)) {
        return (auth.user?.onboardingCompleted ?? false) ? '/' : '/onboarding';
      }
      if (loggedIn && loc != '/onboarding' && !(auth.user?.onboardingCompleted ?? false)) {
        return '/onboarding';
      }
      if (loggedIn && loc == '/onboarding' && (auth.user?.onboardingCompleted ?? false)) {
        return '/';
      }
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (context, state) => const SplashPage()),
      GoRoute(path: '/login', builder: (context, state) => const LoginPage()),
      GoRoute(path: '/signup', builder: (context, state) => const SignupPage()),
      GoRoute(path: '/forgot-password', builder: (context, state) => const ForgotPasswordPage()),
      GoRoute(path: '/reset-password', builder: (context, state) => const ResetPasswordPage()),
      GoRoute(path: '/onboarding', builder: (context, state) => const OnboardingPage()),
      ShellRoute(
        builder: (context, state, child) => AppShell(child: child),
        routes: [
          GoRoute(
            path: '/',
            builder: (context, state) {
              if (finance.accounts.isEmpty && finance.categories.isEmpty && !finance.loading) {
                finance.refresh();
              }
              return const DashboardPage();
            },
          ),
          GoRoute(path: '/more', builder: (context, state) => const MorePage()),
          GoRoute(path: '/transactions', builder: (context, state) => const TransactionsPage()),
          GoRoute(path: '/expenses', builder: (context, state) => const ExpensesPage()),
          GoRoute(path: '/income', builder: (context, state) => const IncomePage()),
          GoRoute(path: '/budgets', builder: (context, state) => const BudgetsPage()),
          GoRoute(path: '/categories', builder: (context, state) => const CategoriesPage()),
          GoRoute(path: '/accounts', builder: (context, state) => const AccountsPage()),
          GoRoute(path: '/insights', builder: (context, state) => const InsightsPage()),
          GoRoute(path: '/analytics', builder: (context, state) => const AnalyticsPage()),
          GoRoute(path: '/reports', builder: (context, state) => const ReportsPage()),
          GoRoute(path: '/import-export', builder: (context, state) => const ImportExportPage()),
          GoRoute(path: '/recurring', builder: (context, state) => const RecurringPage()),
          GoRoute(path: '/goals', builder: (context, state) => const GoalsPage()),
          GoRoute(path: '/notifications', builder: (context, state) => const NotificationsPage()),
          GoRoute(path: '/settings', builder: (context, state) => const SettingsPage()),
          GoRoute(path: '/profile', builder: (context, state) => const ProfilePage()),
        ],
      ),
    ],
  );
}

class AureumApp extends StatelessWidget {
  const AureumApp({super.key, required this.router});

  final GoRouter router;

  @override
  Widget build(BuildContext context) {
    final appearance = context.watch<AppearanceController>();
    return MaterialApp.router(
      title: 'Aureum',
      debugShowCheckedModeBanner: false,
      theme: AureumTheme.build(brightness: Brightness.light, appearance: appearance.appearance),
      darkTheme: AureumTheme.build(brightness: Brightness.dark, appearance: appearance.appearance),
      themeMode: appearance.themeMode,
      routerConfig: router,
      builder: (context, child) {
        final media = MediaQuery.of(context);
        return MediaQuery(
          data: media.copyWith(textScaler: media.textScaler.clamp(minScaleFactor: 0.9, maxScaleFactor: 1.4)),
          child: child ?? const SizedBox.shrink(),
        );
      },
    );
  }
}
