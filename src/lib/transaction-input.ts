import type { CreateTransactionInput } from '@/lib/data/client'
import type { TransactionValues } from '@/schemas'

export function toCreateInput(
  values: TransactionValues,
  extras: Partial<CreateTransactionInput> = {},
): CreateTransactionInput {
  return {
    type: extras.type ?? values.type,
    amount: values.amount,
    currency: values.currency,
    categoryId: values.categoryId || null,
    subcategoryId: values.subcategoryId || null,
    accountId: values.accountId,
    toAccountId: extras.toAccountId === undefined ? values.toAccountId || null : extras.toAccountId,
    merchant: values.merchant ?? '',
    description: values.description ?? '',
    notes: values.notes ?? '',
    date: values.date,
    paymentMethod: values.paymentMethod,
    tags: values.tags ?? [],
    recurringId: extras.recurringId ?? null,
    attachmentPath: extras.attachmentPath ?? null,
    attachmentName: extras.attachmentName ?? null,
    isSample: extras.isSample ?? false,
  }
}
