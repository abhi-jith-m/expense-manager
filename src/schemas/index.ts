import { z } from 'zod'

export const authSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const signUpSchema = authSchema.extend({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(80),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address'),
})

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const transactionSchema = z.object({
  type: z.enum(['expense', 'income', 'transfer']),
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  currency: z.string().min(3).max(3),
  categoryId: z.string().optional().nullable(),
  subcategoryId: z.string().optional().nullable(),
  accountId: z.string().min(1, 'Select an account'),
  toAccountId: z.string().optional().nullable(),
  merchant: z.string().max(120).optional(),
  description: z.string().max(200).optional(),
  notes: z.string().max(400).optional(),
  date: z.string().min(1, 'Choose a date'),
  paymentMethod: z.enum(['cash', 'card', 'upi', 'bank_transfer', 'wallet', 'other']),
  tags: z.array(z.string()).optional(),
})

export const transferSchema = transactionSchema.refine(
  (data) => data.type !== 'transfer' || Boolean(data.toAccountId),
  { message: 'Select a destination account', path: ['toAccountId'] },
).refine(
  (data) => data.type !== 'transfer' || data.toAccountId !== data.accountId,
  { message: 'Choose a different destination account', path: ['toAccountId'] },
)

export const accountSchema = z.object({
  name: z.string().min(2, 'Name is required').max(60),
  type: z.enum(['cash', 'bank', 'credit', 'savings', 'wallet']),
  openingBalance: z.coerce.number(),
  currency: z.string().min(3).max(3),
  icon: z.string().min(1),
  color: z.string().min(1),
})

export const categorySchema = z.object({
  name: z.string().min(2, 'Name is required').max(40),
  kind: z.enum(['expense', 'income']),
  icon: z.string().min(1),
  color: z.string().min(1),
  parentId: z.string().optional().nullable(),
})

export const budgetSchema = z.object({
  name: z.string().min(2, 'Name is required').max(60),
  categoryId: z.string().optional().nullable(),
  limitAmount: z.coerce.number().positive('Limit must be greater than zero'),
  period: z.enum(['weekly', 'monthly', 'yearly', 'custom']),
  startDate: z.string().min(1),
  endDate: z.string().optional().nullable(),
  alertThreshold: z.coerce.number().min(10).max(100),
})

export const recurringSchema = z.object({
  type: z.enum(['expense', 'income']),
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  currency: z.string().min(3).max(3),
  categoryId: z.string().optional().nullable(),
  accountId: z.string().min(1, 'Select an account'),
  merchant: z.string().max(120).optional(),
  notes: z.string().max(400).optional(),
  paymentMethod: z.enum(['cash', 'card', 'upi', 'bank_transfer', 'wallet', 'other']),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly', 'custom']),
  interval: z.coerce.number().int().min(1).max(365),
  startDate: z.string().min(1),
  endDate: z.string().optional().nullable(),
})

export const goalSchema = z.object({
  name: z.string().min(2, 'Name is required').max(60),
  targetAmount: z.coerce.number().positive('Target must be greater than zero'),
  currentAmount: z.coerce.number().min(0),
  deadline: z.string().optional().nullable(),
  icon: z.string().min(1),
  color: z.string().min(1),
})

export const profileSchema = z.object({
  fullName: z.string().min(2).max(80),
  currency: z.string().min(3).max(3),
  dateFormat: z.string().min(1),
})

export const onboardingSchema = z.object({
  fullName: z.string().min(2).max(80),
  currency: z.string().min(3).max(3),
  accountName: z.string().min(2).max(60),
  accountType: z.enum(['cash', 'bank', 'credit', 'savings', 'wallet']),
  openingBalance: z.coerce.number(),
  budgetName: z.string().max(60).optional(),
  budgetLimit: z.coerce.number().min(0).optional(),
})

export type AuthValues = z.infer<typeof authSchema>
export type SignUpValues = z.infer<typeof signUpSchema>
export type TransactionValues = z.infer<typeof transactionSchema>
export type AccountValues = z.infer<typeof accountSchema>
export type CategoryValues = z.infer<typeof categorySchema>
export type BudgetValues = z.infer<typeof budgetSchema>
export type RecurringValues = z.infer<typeof recurringSchema>
export type GoalValues = z.infer<typeof goalSchema>
export type ProfileValues = z.infer<typeof profileSchema>
