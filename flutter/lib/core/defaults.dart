import '../models/models.dart';

class DefaultCategory {
  const DefaultCategory({
    required this.name,
    required this.kind,
    required this.icon,
    required this.color,
  });

  final String name;
  final CategoryKind kind;
  final String icon;
  final String color;
}

const defaultExpenseCategories = [
  DefaultCategory(name: 'Food', kind: CategoryKind.expense, icon: 'UtensilsCrossed', color: '#8B5CF6'),
  DefaultCategory(name: 'Transport', kind: CategoryKind.expense, icon: 'Car', color: '#3B82F6'),
  DefaultCategory(name: 'Shopping', kind: CategoryKind.expense, icon: 'ShoppingBag', color: '#EC4899'),
  DefaultCategory(name: 'Bills', kind: CategoryKind.expense, icon: 'Receipt', color: '#22D3EE'),
  DefaultCategory(name: 'Entertainment', kind: CategoryKind.expense, icon: 'Clapperboard', color: '#A855F7'),
  DefaultCategory(name: 'Health', kind: CategoryKind.expense, icon: 'HeartPulse', color: '#F43F5E'),
  DefaultCategory(name: 'Education', kind: CategoryKind.expense, icon: 'GraduationCap', color: '#6366F1'),
  DefaultCategory(name: 'Travel', kind: CategoryKind.expense, icon: 'Plane', color: '#6366F1'),
  DefaultCategory(name: 'Housing', kind: CategoryKind.expense, icon: 'House', color: '#A855F7'),
  DefaultCategory(name: 'Other', kind: CategoryKind.expense, icon: 'CircleEllipsis', color: '#94A3B8'),
];

const defaultIncomeCategories = [
  DefaultCategory(name: 'Salary', kind: CategoryKind.income, icon: 'Briefcase', color: '#8B5CF6'),
  DefaultCategory(name: 'Freelance', kind: CategoryKind.income, icon: 'Laptop', color: '#22D3EE'),
  DefaultCategory(name: 'Business', kind: CategoryKind.income, icon: 'Building2', color: '#3B82F6'),
  DefaultCategory(name: 'Investments', kind: CategoryKind.income, icon: 'TrendingUp', color: '#3B82F6'),
  DefaultCategory(name: 'Gifts', kind: CategoryKind.income, icon: 'Gift', color: '#EC4899'),
  DefaultCategory(name: 'Other income', kind: CategoryKind.income, icon: 'CircleEllipsis', color: '#94A3B8'),
];

const defaultCategories = [...defaultExpenseCategories, ...defaultIncomeCategories];

const categoryIcons = [
  'UtensilsCrossed',
  'Car',
  'ShoppingBag',
  'Receipt',
  'Clapperboard',
  'HeartPulse',
  'GraduationCap',
  'Plane',
  'House',
  'CircleEllipsis',
  'Briefcase',
  'Laptop',
  'Building2',
  'TrendingUp',
  'Gift',
  'Coffee',
  'Fuel',
  'Smartphone',
  'Shirt',
  'Dumbbell',
  'PawPrint',
  'Baby',
  'Music',
  'Gamepad2',
  'Wallet',
  'Landmark',
  'CreditCard',
  'PiggyBank',
  'Banknote',
];

const categoryColors = [
  '#8B5CF6',
  '#A855F7',
  '#6366F1',
  '#3B82F6',
  '#22D3EE',
  '#EC4899',
  '#F43F5E',
  '#F59E0B',
  '#94A3B8',
];

const defaultNotificationPreferences = NotificationPreferences(
  budgetAlerts: true,
  recurringAlerts: true,
  goalAlerts: true,
  importExportAlerts: true,
);
