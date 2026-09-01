import { useNavigate } from 'react-router-dom'
import { formatMoney } from '@/lib/currency'
import type { RelatedTransaction } from '@/lib/insights-api'
import { useVio } from '@/contexts/vio-context'

export function VioTransactionCard({
  transaction,
  currency,
}: {
  transaction: RelatedTransaction
  currency: string
}) {
  const navigate = useNavigate()
  const { closeVio } = useVio()
  return (
    <button
      type="button"
      className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-3 py-2 text-left transition-colors duration-200 hover:bg-card-hover"
      onClick={() => {
        closeVio()
        navigate(`/transactions?edit=${transaction.id}`)
      }}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{transaction.merchant}</p>
        <p className="text-[11px] text-muted-foreground">
          {transaction.category ?? 'Expense'} · {transaction.date}
        </p>
      </div>
      <p className="tabular text-sm font-medium text-expense">{formatMoney(transaction.amount, currency)}</p>
    </button>
  )
}
