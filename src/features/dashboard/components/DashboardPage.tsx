import { lazy, Suspense, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAccounts } from '@/features/accounts'
import { AccountStrip } from '@/features/dashboard/components/AccountStrip'
import { AddExpenseFab } from '@/features/dashboard/components/AddExpenseFab'
import {
  DashboardPageTitle,
  DashboardPeriodFilter,
  type DashboardPeriodMode,
} from '@/features/dashboard/components/DashboardMonthHeader'
import { MonthStatCards } from '@/features/dashboard/components/MonthStatCards'
import { ExpenseFormDialog, useExpenses } from '@/features/expenses'
import { expensesOnMyAccounts, useExpensesInCurrency } from '@/features/expenses/lib/displayCurrency'
import { useExpenseGroups } from '@/features/expenseGroups'
import { useProfile } from '@/features/settings'
import { DEFAULT_CURRENCY } from '@/shared/lib/currencies'
import { monthRange } from '@/shared/lib/format'
import { useOnlineStatus } from '@/shared/lib/online'
import { isSupabaseConfigured } from '@/shared/lib/supabase'
import { SetupNotice } from '@/shared/ui/SetupNotice'

const DashboardCharts = lazy(() =>
  import('./DashboardCharts').then((mod) => ({ default: mod.DashboardCharts })),
)

export function DashboardPage() {
  const { t, i18n } = useTranslation()
  const online = useOnlineStatus()
  const initial = monthRange()
  const { profile } = useProfile()
  const { accounts, createAccount } = useAccounts()
  const { groups } = useExpenseGroups()
  const [addOpen, setAddOpen] = useState(false)
  const [periodMode, setPeriodMode] = useState<DashboardPeriodMode>('month')
  const [monthYear, setMonthYear] = useState(initial.year)
  const [monthIndex, setMonthIndex] = useState(initial.month)
  const [rangeStart, setRangeStart] = useState(initial.start)
  const [rangeEnd, setRangeEnd] = useState(initial.end)

  const monthBounds = useMemo(() => monthRange(new Date(monthYear, monthIndex, 1)), [monthYear, monthIndex])
  const queryRange = periodMode === 'month' ? { start: monthBounds.start, end: monthBounds.end } : { start: rangeStart, end: rangeEnd }

  const { expenses, loading, error, createExpense } = useExpenses(queryRange)
  const dashboardAccounts = useMemo(
    () => accounts.filter((account) => !account.hide_on_dashboard),
    [accounts],
  )
  const hiddenAccountIds = useMemo(
    () => new Set(accounts.filter((account) => account.hide_on_dashboard).map((account) => account.id)),
    [accounts],
  )
  const ownVisibleExpenses = useMemo(
    () =>
      expensesOnMyAccounts(expenses, accounts).filter((item) => !hiddenAccountIds.has(item.account_id)),
    [expenses, accounts, hiddenAccountIds],
  )
  const lang = i18n.language
  const currency = profile?.default_currency ?? DEFAULT_CURRENCY
  const dashboardExpenses = useExpensesInCurrency(ownVisibleExpenses, accounts, currency, online)
  const total = dashboardExpenses.reduce((sum, item) => sum + item.amount_base, 0)

  return (
    <div className="flex flex-col gap-6">
      {!isSupabaseConfigured ? <SetupNotice /> : null}
      <DashboardPageTitle mode={periodMode} year={monthYear} monthIndex={monthIndex} lang={lang} />
      {loading ? (
        <p className="text-sm text-muted" role="status">
          {t('app.loading')}
        </p>
      ) : null}
      {error && online ? (
        <p className="text-sm text-red-600" role="alert">
          {t('expense.error')}
        </p>
      ) : null}
      <AccountStrip
        accounts={dashboardAccounts}
        lang={lang}
        defaultCurrency={currency}
        createDisabled={!online}
        onCreateAccount={async (values) => {
          await createAccount(values)
        }}
      />
      <DashboardPeriodFilter
        mode={periodMode}
        year={monthYear}
        monthIndex={monthIndex}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        lang={lang}
        onModeChange={(mode) => {
          setPeriodMode(mode)
          if (mode === 'range') {
            setRangeStart(monthBounds.start)
            setRangeEnd(monthBounds.end)
          }
        }}
        onMonthChange={(year, month) => {
          setMonthYear(year)
          setMonthIndex(month)
        }}
        onRangeChange={(start, end) => {
          if (start && end && start > end) {
            setRangeStart(end)
            setRangeEnd(start)
            return
          }
          setRangeStart(start)
          setRangeEnd(end)
        }}
      />
      <MonthStatCards
        totalSpent={total}
        expenseCount={dashboardExpenses.length}
        currency={currency}
        lang={lang}
      />
      {!loading ? (
        <Suspense fallback={<p className="text-sm text-muted">{t('app.loading')}</p>}>
          <DashboardCharts
            expenses={dashboardExpenses}
            start={queryRange.start}
            end={queryRange.end}
            lang={lang}
            currency={currency}
          />
        </Suspense>
      ) : null}
      <AddExpenseFab onClick={() => setAddOpen(true)} />
      <ExpenseFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        accounts={accounts}
        groups={groups}
        defaultCurrency={currency}
        onSubmit={async (input) => {
          await createExpense(input)
        }}
      />
    </div>
  )
}
