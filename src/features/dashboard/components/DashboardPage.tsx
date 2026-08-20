import { lazy, Suspense, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAccounts } from '@/features/accounts'
import { AccountStrip } from '@/features/dashboard/components/AccountStrip'
import { AddExpenseFab } from '@/features/dashboard/components/AddExpenseFab'
import { DashboardMonthHeader } from '@/features/dashboard/components/DashboardMonthHeader'
import { MonthStatCards } from '@/features/dashboard/components/MonthStatCards'
import { ExpenseFormDialog, useExpenses } from '@/features/expenses'
import { useProfile } from '@/features/settings'
import { monthRange } from '@/shared/lib/format'
import { isSupabaseConfigured } from '@/shared/lib/supabase'
import { SetupNotice } from '@/shared/ui/SetupNotice'

const DashboardCharts = lazy(() =>
  import('./DashboardCharts').then((mod) => ({ default: mod.DashboardCharts })),
)

export function DashboardPage() {
  const { t, i18n } = useTranslation()
  const range = monthRange()
  const { profile } = useProfile()
  const { accounts, reload: reloadAccounts, createAccount } = useAccounts()
  const { expenses, loading, error, createExpense, reload: reloadExpenses } = useExpenses({
    start: range.start,
    end: range.end,
  })
  const [addOpen, setAddOpen] = useState(false)
  const total = expenses.reduce((sum, item) => sum + item.amount_base, 0)
  const lang = i18n.language
  const currency = profile?.default_currency ?? 'USD'

  return (
    <div className="flex flex-col gap-6">
      {!isSupabaseConfigured ? <SetupNotice /> : null}
      <DashboardMonthHeader
        year={range.year}
        monthIndex={range.month}
        lang={lang}
        onAddExpense={() => setAddOpen(true)}
      />
      {loading ? <p className="text-sm text-muted">{t('app.loading')}</p> : null}
      {error ? <p className="text-sm text-red-600">{t('expense.error')}</p> : null}
      <AccountStrip
        accounts={accounts}
        lang={lang}
        defaultCurrency={currency}
        onCreateAccount={async (values) => {
          await createAccount(values)
          await reloadAccounts()
        }}
      />
      <MonthStatCards
        totalSpent={total}
        expenseCount={expenses.length}
        currency={currency}
        lang={lang}
      />
      {!loading ? (
        <Suspense fallback={<p className="text-sm text-muted">{t('app.loading')}</p>}>
          <DashboardCharts expenses={expenses} year={range.year} monthIndex={range.month} />
        </Suspense>
      ) : null}
      <AddExpenseFab onClick={() => setAddOpen(true)} />
      <ExpenseFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        accounts={accounts}
        defaultCurrency={currency}
        onSubmit={async (input) => {
          await createExpense(input)
          await reloadAccounts()
          await reloadExpenses()
          setAddOpen(false)
        }}
      />
    </div>
  )
}
