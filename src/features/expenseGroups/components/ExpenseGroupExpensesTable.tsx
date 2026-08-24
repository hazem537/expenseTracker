import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import type { Account } from '@/features/accounts/hooks/useAccounts'
import type { Expense } from '@/features/expenses/hooks/useExpenses'
import { formatDate } from '@/shared/lib/format'
import { MoneyText } from '@/shared/ui/HideMoney'

const PAGE_SIZE = 10

interface ExpenseGroupExpensesTableProps {
  expenses: Expense[]
  accounts: Account[]
  currencyFallback: string
  lang: string
  personName: (userId: string) => string
}

export function ExpenseGroupExpensesTable({
  expenses,
  accounts,
  currencyFallback,
  lang,
  personName,
}: ExpenseGroupExpensesTableProps) {
  const { t } = useTranslation()
  const [page, setPage] = useState(0)

  const totalPages = Math.max(1, Math.ceil(expenses.length / PAGE_SIZE))

  useEffect(() => {
    setPage(0)
  }, [expenses.length])

  useEffect(() => {
    if (page > totalPages - 1) setPage(Math.max(0, totalPages - 1))
  }, [page, totalPages])

  const pageRows = useMemo(() => {
    const start = page * PAGE_SIZE
    return expenses.slice(start, start + PAGE_SIZE)
  }, [expenses, page])

  const from = expenses.length === 0 ? 0 : page * PAGE_SIZE + 1
  const to = Math.min((page + 1) * PAGE_SIZE, expenses.length)

  if (expenses.length === 0) {
    return <p className="text-sm text-muted">{t('expenseGroups.noExpenses')}</p>
  }

  return (
    <div className="space-y-3">
      <div className="-mx-1 overflow-x-auto rounded-2xl border border-gold-soft/70 bg-surface sm:mx-0">
        <table className="w-full min-w-[32rem] border-collapse text-start text-sm">
          <thead>
            <tr className="border-b border-gold-soft/60 bg-gold-soft/20 text-xs font-semibold uppercase tracking-wide text-muted">
              <th className="px-3 py-2.5 font-semibold">{t('expense.date')}</th>
              <th className="px-3 py-2.5 font-semibold">{t('expense.category')}</th>
              <th className="px-3 py-2.5 font-semibold">{t('expenseGroups.colPaidBy')}</th>
              <th className="px-3 py-2.5 text-end font-semibold">{t('expense.amount')}</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((expense) => {
              const accountCurrency =
                accounts.find((a) => a.id === expense.account_id)?.currency ?? currencyFallback
              return (
                <tr
                  key={expense.id}
                  className="border-b border-gold-soft/40 last:border-b-0 odd:bg-surface even:bg-gold-soft/10"
                >
                  <td className="whitespace-nowrap px-3 py-2.5 text-muted">
                    {formatDate(expense.occurred_on, lang)}
                  </td>
                  <td className="max-w-[8rem] truncate px-3 py-2.5 font-medium text-heading">
                    {t(`categories.${expense.category}`)}
                    {expense.note ? (
                      <span className="mt-0.5 block truncate text-xs font-normal text-muted">
                        {expense.note}
                      </span>
                    ) : null}
                  </td>
                  <td className="max-w-[7rem] truncate px-3 py-2.5 text-muted">
                    {personName(expense.user_id)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-end font-semibold text-heading">
                    <MoneyText amount={expense.amount} lang={lang} currency={accountCurrency} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted">
          {t('expenseGroups.pageRange', { from, to, total: expenses.length })}
        </p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-10 rounded-xl"
            disabled={page <= 0}
            aria-label={t('expenseGroups.prevPage')}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <ChevronLeft className="rtl:rotate-180" />
          </Button>
          <span className="min-w-[4.5rem] text-center text-xs font-medium text-heading">
            {t('expenseGroups.pageOf', { page: page + 1, pages: totalPages })}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-10 rounded-xl"
            disabled={page >= totalPages - 1}
            aria-label={t('expenseGroups.nextPage')}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          >
            <ChevronRight className="rtl:rotate-180" />
          </Button>
        </div>
      </div>
    </div>
  )
}
