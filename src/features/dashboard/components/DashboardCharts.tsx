import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PieChart } from 'lucide-react'
import { CATEGORIES, CATEGORY_COLORS, type Category } from '@/features/expenses/lib/categories'
import type { Expense } from '@/features/expenses/hooks/useExpenses'
import { eachIsoDay, formatDate } from '@/shared/lib/format'
import { MoneyText } from '@/shared/ui/HideMoney'

interface DashboardChartsProps {
  expenses: Expense[]
  start: string
  end: string
  lang: string
  currency: string
}

const RING = 20
const ringMask = {
  WebkitMask: `radial-gradient(farthest-side, transparent calc(100% - ${RING}px), #000 calc(100% - ${RING - 0.5}px))`,
  mask: `radial-gradient(farthest-side, transparent calc(100% - ${RING}px), #000 calc(100% - ${RING - 0.5}px))`,
} as const

export function DashboardCharts({ expenses, start, end, lang, currency }: DashboardChartsProps) {
  const { t } = useTranslation()
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

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
    let startDeg = 0
    const stops = categoryRows.map((row) => {
      const end = startDeg + (row.total / categoryTotal) * 360
      const slice = `${CATEGORY_COLORS[row.category]} ${startDeg}deg ${end}deg`
      startDeg = end
      return slice
    })
    return `conic-gradient(${stops.join(', ')})`
  }, [categoryRows, categoryTotal])

  const dayRows = useMemo(() => {
    const days = eachIsoDay(start, end)
    if (days.length > 62) {
      const totals: Record<string, number> = {}
      for (const iso of days) {
        const key = iso.slice(0, 7)
        totals[key] = 0
      }
      for (const item of expenses) {
        const key = item.occurred_on.slice(0, 7)
        if (totals[key] != null) totals[key] += item.amount_base
      }
      return Object.keys(totals)
        .sort()
        .map((key) => ({ iso: `${key}-01`, total: totals[key] ?? 0 }))
    }
    const totals = Object.fromEntries(days.map((iso) => [iso, 0])) as Record<string, number>
    for (const item of expenses) {
      if (totals[item.occurred_on] != null) totals[item.occurred_on] += item.amount_base
    }
    return days.map((iso) => ({ iso, total: totals[iso] ?? 0 }))
  }, [expenses, start, end])

  const dayStats = useMemo(() => {
    const maxDay = Math.max(...dayRows.map((row) => row.total), 0)
    const peak = dayRows.reduce(
      (best, row) => (row.total > best.total ? row : best),
      dayRows[0] ?? { iso: start, total: 0 },
    )
    return { maxDay, peak }
  }, [dayRows, start])

  const todayIso = new Date().toISOString().slice(0, 10)
  const activeCategory =
    categoryRows.find((row) => row.category === selectedCategory) ?? categoryRows[0] ?? null
  const activeShare =
    activeCategory && categoryTotal > 0 ? (activeCategory.total / categoryTotal) * 100 : 0
  const { maxDay, peak } = dayStats
  const selectedDayRow = dayRows.find((row) => row.iso === selectedDay) ?? null
  const midIndex = Math.max(0, Math.floor((dayRows.length - 1) / 2))
  const lastRow = dayRows[dayRows.length - 1]
  const firstLabel = dayRows[0] ? formatDate(dayRows[0].iso, lang) : ''
  const midLabel = dayRows[midIndex] ? formatDate(dayRows[midIndex].iso, lang) : ''
  const lastLabel = lastRow ? formatDate(lastRow.iso, lang) : ''

  const card =
    'w-full rounded-2xl border border-gold-soft/80 bg-surface p-5 shadow-[0_12px_28px_rgba(201,162,39,0.1)] sm:p-6'

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
                  {activeCategory?.label}
                </p>
                <p className="text-sm font-semibold leading-5 text-heading">
                  {activeCategory ? (
                    <MoneyText amount={activeCategory.total} lang={lang} currency={currency} />
                  ) : null}
                </p>
                <p className="text-xs text-muted">{activeShare.toFixed(0)}%</p>
              </div>
            </div>
            <ul className="w-full min-w-0 space-y-3">
              {categoryRows.map((row) => {
                const share = (row.total / categoryTotal) * 100
                const selected = row.category === (selectedCategory ?? categoryRows[0]?.category)
                return (
                  <li key={row.category}>
                    <button
                      type="button"
                      className={`w-full space-y-1 rounded-xl p-1 text-start ${
                        selected ? 'bg-gold-soft/25' : ''
                      }`}
                      onClick={() => setSelectedCategory(row.category)}
                    >
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="flex min-w-0 items-center gap-2 text-ink">
                          <span
                            className="size-2.5 shrink-0 rounded-full ring-2 ring-gold-soft/50"
                            style={{ background: CATEGORY_COLORS[row.category] }}
                          />
                          <span className="truncate">{row.label}</span>
                        </span>
                        <span className="shrink-0 text-end font-medium tabular-nums text-heading">
                          <MoneyText amount={row.total} lang={lang} currency={currency} />
                          <span className="ms-1 text-xs font-normal text-muted">{share.toFixed(0)}%</span>
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
                    </button>
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
              {formatDate(peak.iso, lang)} · <MoneyText amount={peak.total} lang={lang} currency={currency} />
            </p>
          ) : null}
        </div>
        {selectedDayRow ? (
          <p className="mb-2 text-sm font-medium text-heading">
            {formatDate(selectedDayRow.iso, lang)} ·{' '}
            <MoneyText amount={selectedDayRow.total} lang={lang} currency={currency} />
          </p>
        ) : (
          <p className="mb-2 text-xs text-muted">{t('dashboard.tapDay')}</p>
        )}
        <div
          className="relative flex h-44 w-full items-end gap-0.5 overflow-x-auto rounded-xl bg-navy/4 px-1 pt-2 dark:bg-ivory/4"
          role="img"
          aria-label={t('dashboard.byDay')}
        >
          <div className="pointer-events-none absolute inset-x-1 top-2 border-t border-dashed border-gold-soft/50" />
          {dayRows.map((row) => {
            const isToday = todayIso === row.iso
            const isPeak = peak?.iso === row.iso && row.total > 0
            const isSelected = selectedDay === row.iso
            const height =
              maxDay > 0 ? Math.max((row.total / maxDay) * 100, row.total > 0 ? 8 : 0) : 0
            return (
              <button
                key={row.iso}
                type="button"
                className="group relative min-w-1.5 flex-1"
                style={{ height: `${height}%` }}
                title={`${formatDate(row.iso, lang)}: ${row.total}`}
                onClick={() => setSelectedDay((iso) => (iso === row.iso ? null : row.iso))}
              >
                <div
                  className={`h-full w-full rounded-t-md transition-transform group-hover:scale-y-105 ${
                    isToday || isPeak || isSelected
                      ? 'bg-linear-to-t from-gold to-gold-bright'
                      : 'bg-linear-to-t from-navy to-navy-mid'
                  }`}
                />
              </button>
            )
          })}
        </div>
        <div className="flex items-start justify-between gap-2 px-1 pt-2 text-[11px] font-semibold text-muted">
          <span className="truncate">{firstLabel}</span>
          <span className="truncate text-center">{midLabel}</span>
          <span className="truncate text-end">{lastLabel}</span>
        </div>
      </section>
    </div>
  )
}
