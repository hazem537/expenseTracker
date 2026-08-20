import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { CATEGORIES, CATEGORY_COLORS, type Category } from '@/features/expenses/lib/categories'
import type { Expense } from '@/features/expenses/hooks/useExpenses'
import { daysInMonth } from '@/shared/lib/format'

interface DashboardChartsProps {
  expenses: Expense[]
  year: number
  monthIndex: number
}

export function DashboardCharts({ expenses, year, monthIndex }: DashboardChartsProps) {
  const { t } = useTranslation()

  const categoryRows = useMemo(() => {
    const totals = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<Category, number>
    for (const item of expenses) {
      totals[item.category] += item.amount_base
    }
    return CATEGORIES.filter((c) => totals[c] > 0).map((category) => ({
      category,
      label: t(`categories.${category}`),
      total: totals[category],
    }))
  }, [expenses, t])

  const categoryTotal = useMemo(
    () => categoryRows.reduce((sum, row) => sum + row.total, 0),
    [categoryRows],
  )

  const donutGradient = useMemo(() => {
    if (categoryTotal <= 0) return '#eae7e9'
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

  const maxDay = Math.max(...dayRows.map((row) => row.total), 0)
  const lastDay = dayRows.length
  const midDay = Math.round((lastDay + 1) / 2)

  const card =
    'w-full rounded-xl border border-[#c6c6cd] bg-white p-6 shadow-[0px_1px_1.5px_rgba(15,23,42,0.03),0px_10px_10px_rgba(15,23,42,0.05)]'

  if (expenses.length === 0) {
    return <p className={`${card} text-[#45464d]`}>{t('dashboard.emptyChart')}</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <section className={card}>
        <h2 className="mb-4 text-xl font-semibold leading-7 text-black">{t('dashboard.byCategory')}</h2>
        {categoryRows.length === 0 ? (
          <p className="text-[#45464d]">{t('dashboard.emptyChart')}</p>
        ) : (
          <>
            <div className="flex h-44 items-center justify-center pb-4">
              <div className="relative size-40 shrink-0">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: '#eae7e9',
                    WebkitMask:
                      'radial-gradient(farthest-side, transparent calc(100% - 16px), #000 calc(100% - 15.5px))',
                    mask: 'radial-gradient(farthest-side, transparent calc(100% - 16px), #000 calc(100% - 15.5px))',
                  }}
                  aria-hidden
                />
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: donutGradient,
                    WebkitMask:
                      'radial-gradient(farthest-side, transparent calc(100% - 16px), #000 calc(100% - 15.5px))',
                    mask: 'radial-gradient(farthest-side, transparent calc(100% - 16px), #000 calc(100% - 15.5px))',
                  }}
                  aria-hidden
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-xl font-semibold leading-7 text-black">100%</p>
                </div>
              </div>
            </div>
            <ul className="flex flex-wrap items-center justify-center gap-2 text-sm leading-5 text-[#1b1b1d]">
              {categoryRows.map((row) => (
                <li key={row.category} className="flex items-center gap-1">
                  <span
                    className="size-3 shrink-0 rounded-full"
                    style={{ background: CATEGORY_COLORS[row.category] }}
                  />
                  {row.label}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
      <section className={`${card} flex flex-col`}>
        <h2 className="mb-4 text-xl font-semibold leading-7 text-black">{t('dashboard.byDay')}</h2>
        <div className="flex h-40 w-full items-end justify-between gap-px" role="img" aria-label={t('dashboard.byDay')}>
          {dayRows.map((row) => (
            <div
              key={row.day}
              className="min-w-0 flex-1 rounded-t-[2px] bg-black"
              style={{ height: maxDay > 0 ? `${Math.max((row.total / maxDay) * 90, row.total > 0 ? 4 : 0)}%` : 0 }}
              title={`${row.day}: ${row.total}`}
            />
          ))}
        </div>
        <div className="flex items-start justify-between pt-2 text-xs font-semibold leading-4 tracking-[0.6px] text-[#45464d]">
          <span>1</span>
          <span>{midDay}</span>
          <span>{lastDay}</span>
        </div>
      </section>
    </div>
  )
}
