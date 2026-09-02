import 'package:flutter/material.dart';

class NavItem {
  const NavItem({required this.to, required this.label, required this.icon, this.primary = false});

  final String to;
  final String label;
  final IconData icon;
  final bool primary;
}

const navItems = [
  NavItem(to: '/', label: 'Dashboard', icon: Icons.space_dashboard_outlined, primary: true),
  NavItem(to: '/transactions', label: 'Transactions', icon: Icons.swap_horiz, primary: true),
  NavItem(to: '/expenses', label: 'Add expense', icon: Icons.trending_down, primary: true),
  NavItem(to: '/income', label: 'Income', icon: Icons.trending_up, primary: true),
  NavItem(to: '/budgets', label: 'Budgets', icon: Icons.account_balance_wallet_outlined),
  NavItem(to: '/categories', label: 'Categories', icon: Icons.label_outline),
  NavItem(to: '/accounts', label: 'Accounts', icon: Icons.account_balance_outlined),
  NavItem(to: '/insights', label: 'Insights', icon: Icons.auto_awesome, primary: true),
  NavItem(to: '/analytics', label: 'Analytics', icon: Icons.insights_outlined),
  NavItem(to: '/reports', label: 'Reports', icon: Icons.insert_chart_outlined),
  NavItem(to: '/import-export', label: 'Import / Export', icon: Icons.upload_outlined),
  NavItem(to: '/recurring', label: 'Recurring', icon: Icons.repeat),
  NavItem(to: '/goals', label: 'Goals', icon: Icons.flag_outlined),
  NavItem(to: '/notifications', label: 'Notifications', icon: Icons.notifications_none),
  NavItem(to: '/settings', label: 'Settings', icon: Icons.settings_outlined),
  NavItem(to: '/profile', label: 'Profile', icon: Icons.person_outline),
];

const mobileTabs = [
  NavItem(to: '/', label: 'Home', icon: Icons.home_outlined),
  NavItem(to: '/transactions', label: 'Transactions', icon: Icons.swap_horiz),
  NavItem(to: '/analytics', label: 'Analytics', icon: Icons.insights_outlined),
  NavItem(to: '/budgets', label: 'Budgets', icon: Icons.account_balance_wallet_outlined),
  NavItem(to: '/more', label: 'More', icon: Icons.more_horiz),
];

const primaryDestinations = {'/', '/transactions', '/analytics', '/budgets', '/more'};
