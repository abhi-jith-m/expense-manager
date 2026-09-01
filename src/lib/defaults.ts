import type { CategoryKind } from '@/types'

export interface DefaultCategory {
  name: string
  kind: CategoryKind
  icon: string
  color: string
}

export const DEFAULT_EXPENSE_CATEGORIES: DefaultCategory[] = [
  { name: 'Food', kind: 'expense', icon: 'UtensilsCrossed', color: '#8B5CF6' },
  { name: 'Transport', kind: 'expense', icon: 'Car', color: '#3B82F6' },
  { name: 'Shopping', kind: 'expense', icon: 'ShoppingBag', color: '#EC4899' },
  { name: 'Bills', kind: 'expense', icon: 'Receipt', color: '#22D3EE' },
  { name: 'Entertainment', kind: 'expense', icon: 'Clapperboard', color: '#A855F7' },
  { name: 'Health', kind: 'expense', icon: 'HeartPulse', color: '#F43F5E' },
  { name: 'Education', kind: 'expense', icon: 'GraduationCap', color: '#6366F1' },
  { name: 'Travel', kind: 'expense', icon: 'Plane', color: '#6366F1' },
  { name: 'Housing', kind: 'expense', icon: 'House', color: '#A855F7' },
  { name: 'Other', kind: 'expense', icon: 'CircleEllipsis', color: '#94A3B8' },
]

export const DEFAULT_INCOME_CATEGORIES: DefaultCategory[] = [
  { name: 'Salary', kind: 'income', icon: 'Briefcase', color: '#8B5CF6' },
  { name: 'Freelance', kind: 'income', icon: 'Laptop', color: '#22D3EE' },
  { name: 'Business', kind: 'income', icon: 'Building2', color: '#3B82F6' },
  { name: 'Investments', kind: 'income', icon: 'TrendingUp', color: '#3B82F6' },
  { name: 'Gifts', kind: 'income', icon: 'Gift', color: '#EC4899' },
  { name: 'Other income', kind: 'income', icon: 'CircleEllipsis', color: '#94A3B8' },
]

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  ...DEFAULT_EXPENSE_CATEGORIES,
  ...DEFAULT_INCOME_CATEGORIES,
]

export const CATEGORY_ICONS = [
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
] as const

export const CATEGORY_COLORS = [
  '#8B5CF6',
  '#A855F7',
  '#6366F1',
  '#3B82F6',
  '#22D3EE',
  '#EC4899',
  '#F43F5E',
  '#F59E0B',
  '#94A3B8',
]

export const DEFAULT_NOTIFICATION_PREFERENCES = {
  budgetAlerts: true,
  recurringAlerts: true,
  goalAlerts: true,
  importExportAlerts: true,
}
