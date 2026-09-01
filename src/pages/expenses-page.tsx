import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/shared/page-header'
import { TransactionForm } from '@/components/shared/transaction-form'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { useAccounts, useCategories, useCreateTransaction } from '@/hooks/use-finance'
import { toUserMessage } from '@/lib/data/errors'
import { toCreateInput } from '@/lib/transaction-input'

export function ExpensesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const accounts = useAccounts()
  const categories = useCategories()
  const createTransaction = useCreateTransaction()

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title="Add expense"
        description="A fast, keyboard-friendly form. Amount first, then the details that matter."
      />
      <Card className="flex min-h-0 flex-1 flex-col">
        <CardContent className="flex min-h-0 flex-1 flex-col p-5 sm:p-6 lg:p-8">
          <TransactionForm
            wide
            accounts={accounts.data ?? []}
            categories={categories.data ?? []}
            defaultType="expense"
            defaultCurrency={user?.currency ?? 'USD'}
            submitting={createTransaction.isPending}
            onSubmit={async (values) => {
              try {
                await createTransaction.mutateAsync(toCreateInput(values))
                toast.success('Expense saved')
                navigate('/')
              } catch (error) {
                toast.error(toUserMessage(error))
              }
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
