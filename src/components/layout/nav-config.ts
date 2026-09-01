import {
  ArrowLeftRight,
  Bell,
  ChartNoAxesCombined,
  FileChartColumn,
  Landmark,
  LayoutDashboard,
  Repeat,
  Settings,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Upload,
  User,
  WalletCards,
  Tags,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  primary?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, primary: true },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight, primary: true },
  { to: '/expenses', label: 'Add expense', icon: TrendingDown, primary: true },
  { to: '/income', label: 'Income', icon: TrendingUp, primary: true },
  { to: '/budgets', label: 'Budgets', icon: WalletCards },
  { to: '/categories', label: 'Categories', icon: Tags },
  { to: '/accounts', label: 'Accounts', icon: Landmark },
  { to: '/insights', label: 'Insights', icon: Sparkles, primary: true },
  { to: '/analytics', label: 'Analytics', icon: ChartNoAxesCombined },
  { to: '/reports', label: 'Reports', icon: FileChartColumn },
  { to: '/import-export', label: 'Import / Export', icon: Upload },
  { to: '/recurring', label: 'Recurring', icon: Repeat },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/profile', label: 'Profile', icon: User },
]

export const MOBILE_PRIMARY = NAV_ITEMS.filter((item) => item.primary).slice(0, 4)
