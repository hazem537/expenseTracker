import { lazy, Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { SetupNotice } from '../../components/SetupNotice'
import { useExpenses } from '../../hooks/useExpenses'
import { formatAmount, formatMonthLabel, monthRange } from '../../lib/format'
import { isSupabaseConfigured } from '../../lib/supabase'

const DashboardCharts = lazy(() =>
  import('../../components/DashboardCharts').then((mod) => ({ default: mod.DashboardCharts })),
)

export const Route = createFileRoute('/_app/')({
  component: DashboardPage,
})

function DashboardPage() {
  const { t, i18n } = useTranslation()
  const range = monthRange()
  const { expenses, loading, error } = useExpenses({ start: range.start, end: range.end })
  const total = expenses.reduce((sum, item) => sum + item.amount, 0)
  const lang = i18n.language

  return (
    <div className="space-y-4">
      {!isSupabaseConfigured ? <SetupNotice /> : null}
      <div>
        <p className="text-sm font-medium text-slate-500">{t('dashboard.thisMonth')}</p>
        <h1 className="text-2xl font-bold">{formatMonthLabel(range.year, range.month, lang)}</h1>
      </div>
      {loading ? <p>{t('app.loading')}</p> : null}
      {error ? <p className="text-red-600">{t('expense.error')}</p> : null}
      <div className="grid grid-cols-2 gap-3">
        <article className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">{t('dashboard.totalSpent')}</p>
          <p className="mt-1 text-2xl font-bold">{formatAmount(total, lang)}</p>
        </article>
        <article className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">{t('dashboard.count')}</p>
          <p className="mt-1 text-2xl font-bold">{expenses.length}</p>
        </article>
      </div>
      {!loading ? (
        <Suspense fallback={<p>{t('app.loading')}</p>}>
          <DashboardCharts expenses={expenses} year={range.year} monthIndex={range.month} />
        </Suspense>
      ) : null}
    </div>
  )
}
