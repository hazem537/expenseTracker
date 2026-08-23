import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PieChart } from 'lucide-react'
import { CATEGORIES, CATEGORY_COLORS, type Category } from '@/features/expenses/lib/categories'
import type { Expense } from '@/features/expenses/hooks/useExpenses'
import { daysInMonth } from '@/shared/lib/format'
import { MoneyText } from '@/shared/ui/HideMoney'

interface DashboardChartsProps {
  expenses: Expense[]
  year: number
  monthIndex: number
  lang: string
  currency: string
}

const RING = 20
const ringMask = {
  WebkitMask: `radial-gradient(farthest-side, transparent calc(100% - ${RING}px), #000 calc(100% - ${RING - 0.5}px))`,
  mask: `radial-gradient(farthest-side, transparent calc(100% - ${RING}px), #000 calc(100% - ${RING - 0.5}px))`,
} as const

export function DashboardCharts({ expenses, year, monthIndex, lang, currency }: DashboardChartsProps) {
  const { t } = useTranslation()

  const categoryRows = useMemo(() => {
    const totals = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<Category, number>
    for (const item of expenses) {
      totals[item.category] += item.amount_base
    }
    return CATEGORIES.filter((c) => totals[c] > 0)
      .map((category) => ({
        category,
        label: t(`categories.${category}`),
        total: totals[category],
      }))
      .sort((a, b) => b.total - a.total)
  }, [expenses, t])

  const categoryTotal = useMemo(
    () => categoryRows.reduce((sum, row) => sum + row.total, 0),
    [categoryRows],
  )

  const donutGradient = useMemo(() => {
    if (categoryTotal <= 0) return 'var(--gold-soft)'
    let start = 0
    const stops = categoryRows.map((row) => {
      const end = start + (row.total / categoryTotal) * 360
      const slice = `${CATEGORY_COLORS[row.category]} ${start}deg ${end}deg`
      start = end
      return slice
    })
    return `conic-gradient(${stops.join(', ')})`
  }, [categoryRows, categoryTotal])

  const dayRows = useMemo(() => {
    const days = daysInMonth(year, monthIndex)
    const totals = Array.from({ length: days }, () => 0)
    for (const item of expenses) {
      const day = Number(item.occurred_on.slice(8, 10))
      totals[day - 1] += item.amount_base
    }
    return totals.map((total, index) => ({
      day: index + 1,
      total,
    }))
  }, [expenses, monthIndex, year])

  const dayStats = useMemo(() => {
    const maxDay = Math.max(...dayRows.map((row) => row.total), 0)
    const lastDay = dayRows.length
    const midDay = Math.round((lastDay + 1) / 2)
    const peak = dayRows.reduce((best, row) => (row.total > best.total ? row : best), dayRows[0])
    return { maxDay, lastDay, midDay, peak }
  }, [dayRows])

  const now = new Date()
  const todayDay =
    now.getFullYear() === year && now.getMonth() === monthIndex ? now.getDate() : null
  const topShare = categoryTotal > 0 ? (categoryRows[0].total / categoryTotal) * 100 : 0
  const { maxDay, lastDay, midDay, peak } = dayStats

  const card =
    'w-full rounded-2xl border border-gold-soft/80 bg-surface p-5 shadow-[0_12px_28px_rgba(201,162,39,0.1)] sm:p-6'

  // Presentational only: data comes from parent hooks. Three UI states — empty / charts.
  if (expenses.length === 0) {
    return (
      <div className={`${card} flex flex-col items-center gap-2 py-10 text-center`}>
        <span className="flex size-12 items-center justify-center rounded-full bg-gold-soft/40 text-gold" aria-hidden>
          <PieChart className="size-6" />
        </span>
        <p className="text-sm text-muted">{t('dashboard.emptyChart')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <section className={card}>
        <div className="mb-5 flex items-start justify-between gap-3">
          <h2 className="text-xl font-semibold leading-7 text-heading">{t('dashboard.byCategory')}</h2>
          <p className="text-sm font-semibold text-heading">
            <MoneyText amount={categoryTotal} lang={lang} currency={currency} />
          </p>
        </div>
        {categoryRows.length === 0 ? (
          <p className="text-muted">{t('dashboard.emptyChart')}</p>
        ) : (
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
            <div className="relative size-44 shrink-0">
              <div
                className="absolute inset-0 rounded-full"
                style={{ background: 'var(--gold-soft)', ...ringMask }}
                aria-hidden
              />
              <div
                className="absolute inset-0 rounded-full"
                style={{ background: donutGradient, ...ringMask }}
                aria-hidden
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
                  {categoryRows[0].label}
                </p>
                <p className="text-2xl font-semibold leading-8 text-heading">{topShare.toFixed(0)}%</p>
              </div>
            </div>
            <ul className="w-full min-w-0 space-y-3">
              {categoryRows.map((row) => {
                const share = (row.total / categoryTotal) * 100
                return (
                  <li key={row.category} className="space-y-1">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex min-w-0 items-center gap-2 text-ink">
                        <span
                          className="size-2.5 shrink-0 rounded-full ring-2 ring-gold-soft/50"
                          style={{ background: CATEGORY_COLORS[row.category] }}
                        />
                        <span className="truncate">{row.label}</span>
                      </span>
                      <span className="shrink-0 font-medium tabular-nums text-heading">
                        {share.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-gold-soft/35">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(share, 2)}%`,
                          background: CATEGORY_COLORS[row.category],
                        }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </section>
      <section className={`${card} flex flex-col`}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-xl font-semibold leading-7 text-heading">{t('dashboard.byDay')}</h2>
          {peak && peak.total > 0 ? (
            <p className="text-xs font-medium text-muted">
              {peak.day} · <MoneyText amount={peak.total} lang={lang} currency={currency} />
            </p>
          ) : null}
        </div>
        <div
          className="relative flex h-44 w-full items-end gap-0.75 rounded-xl bg-navy/4 px-1 pt-2 dark:bg-ivory/4"
          role="img"
          aria-label={t('dashboard.byDay')}
        >
          <div className="pointer-events-none absolute inset-x-1 top-2 border-t border-dashed border-gold-soft/50" />
          {dayRows.map((row) => {
            const isToday = todayDay === row.day
            const isPeak = peak?.day === row.day && row.total > 0
            const height =
              maxDay > 0 ? Math.max((row.total / maxDay) * 100, row.total > 0 ? 8 : 0) : 0
            return (
              <div
                key={row.day}
                className="group relative min-w-0 flex-1"
                style={{ height: `${height}%` }}
                title={`${row.day}: ${row.total}`}
              >
                <div
                  className={`h-full w-full rounded-t-md transition-transform group-hover:scale-y-105 ${
                    isToday || isPeak
                      ? 'bg-linear-to-t from-gold to-gold-bright'
                      : 'bg-linear-to-t from-navy to-navy-mid'
                  }`}
                />
              </div>
            )
          })}
        </div>
        <div className="flex items-start justify-between px-1 pt-2 text-[11px] font-semibold tracking-[0.08em] text-muted">
          <span>1</span>
          <span>{midDay}</span>
          <span>{lastDay}</span>
        </div>
      </section>
    </div>
  )
}
