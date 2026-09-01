import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { AppShell } from '@/components/layout/app-shell'
import { GuestRoute, ProtectedRoute } from '@/components/layout/protected-route'
import { Skeleton } from '@/components/ui/skeleton'

const LoginPage = lazy(() => import('@/pages/auth/login-page').then((m) => ({ default: m.LoginPage })))
const SignupPage = lazy(() => import('@/pages/auth/signup-page').then((m) => ({ default: m.SignupPage })))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/forgot-password-page').then((m) => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('@/pages/auth/reset-password-page').then((m) => ({ default: m.ResetPasswordPage })))
const OnboardingPage = lazy(() => import('@/pages/onboarding-page').then((m) => ({ default: m.OnboardingPage })))
const DashboardPage = lazy(() => import('@/pages/dashboard-page').then((m) => ({ default: m.DashboardPage })))
const TransactionsPage = lazy(() => import('@/pages/transactions-page').then((m) => ({ default: m.TransactionsPage })))
const ExpensesPage = lazy(() => import('@/pages/expenses-page').then((m) => ({ default: m.ExpensesPage })))
const IncomePage = lazy(() => import('@/pages/income-page').then((m) => ({ default: m.IncomePage })))
const BudgetsPage = lazy(() => import('@/pages/budgets-page').then((m) => ({ default: m.BudgetsPage })))
const CategoriesPage = lazy(() => import('@/pages/categories-page').then((m) => ({ default: m.CategoriesPage })))
const AccountsPage = lazy(() => import('@/pages/accounts-page').then((m) => ({ default: m.AccountsPage })))
const InsightsPage = lazy(() => import('@/pages/insights-page').then((m) => ({ default: m.InsightsPage })))
const AnalyticsPage = lazy(() => import('@/pages/analytics-page').then((m) => ({ default: m.AnalyticsPage })))
const ReportsPage = lazy(() => import('@/pages/reports-page').then((m) => ({ default: m.ReportsPage })))
const ImportExportPage = lazy(() => import('@/pages/import-export-page').then((m) => ({ default: m.ImportExportPage })))
const RecurringPage = lazy(() => import('@/pages/recurring-page').then((m) => ({ default: m.RecurringPage })))
const GoalsPage = lazy(() => import('@/pages/goals-page').then((m) => ({ default: m.GoalsPage })))
const NotificationsPage = lazy(() => import('@/pages/notifications-page').then((m) => ({ default: m.NotificationsPage })))
const SettingsPage = lazy(() => import('@/pages/settings-page').then((m) => ({ default: m.SettingsPage })))
const ProfilePage = lazy(() => import('@/pages/profile-page').then((m) => ({ default: m.ProfilePage })))

function Fallback() {
  return (
    <div className="space-y-3 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40 w-full" />
    </div>
  )
}

const router = createBrowserRouter([
  {
    element: <GuestRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignupPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
    ],
  },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/onboarding', element: <OnboardingPage /> },
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/transactions', element: <TransactionsPage /> },
          { path: '/expenses', element: <ExpensesPage /> },
          { path: '/income', element: <IncomePage /> },
          { path: '/budgets', element: <BudgetsPage /> },
          { path: '/categories', element: <CategoriesPage /> },
          { path: '/accounts', element: <AccountsPage /> },
          { path: '/insights', element: <InsightsPage /> },
          { path: '/analytics', element: <AnalyticsPage /> },
          { path: '/reports', element: <ReportsPage /> },
          { path: '/import-export', element: <ImportExportPage /> },
          { path: '/recurring', element: <RecurringPage /> },
          { path: '/goals', element: <GoalsPage /> },
          { path: '/notifications', element: <NotificationsPage /> },
          { path: '/settings', element: <SettingsPage /> },
          { path: '/profile', element: <ProfilePage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

export function AppRouter() {
  return (
    <Suspense fallback={<Fallback />}>
      <RouterProvider router={router} />
    </Suspense>
  )
}
