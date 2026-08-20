import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { barY } from '@tanstack/charts/bar'
import { pie, polar, radialArc } from '@tanstack/charts/polar'
import { Chart } from '@tanstack/charts/react'
import { scaleBand } from '@tanstack/charts/scales/band'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { defineChart } from '@tanstack/charts/scene'
import { tooltip } from '@tanstack/charts/tooltip'
import { CATEGORIES, CATEGORY_COLORS, type Category } from '../lib/categories'
import { daysInMonth } from '../lib/format'
import type { Expense } from '../hooks/useExpenses'

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
      totals[item.category] += item.amount
    }
    return CATEGORIES.filter((c) => totals[c] > 0).map((category) => ({
      category,
      label: t(`categories.${category}`),
      total: totals[category],
    }))
  }, [expenses, t])

  const dayRows = useMemo(() => {
    const days = daysInMonth(year, monthIndex)
    const totals = Array.from({ length: days }, () => 0)
    for (const item of expenses) {
      const day = Number(item.occurred_on.slice(8, 10))
      totals[day - 1] += item.amount
    }
    return totals.map((total, index) => ({
      day: String(index + 1),
      total,
    }))
  }, [expenses, monthIndex, year])

  const pieDefinition = useMemo(() => {
    const slices = pie(categoryRows, { value: 'total' })
    return defineChart({
      marks: [
        polar({
          inset: 8,
          radiusRatio: 0.82,
          marks: [
            radialArc(slices, {
              innerRadius: ({ radius }: { radius: number }) => radius * 0.48,
              color: 'category',
              key: 'category',
            }),
          ],
        }),
      ],
      color: {
        domain: [...CATEGORIES],
        range: CATEGORIES.map((c) => CATEGORY_COLORS[c]),
      },
      tooltip,
    })
  }, [categoryRows])

  const barDefinition = useMemo(() => {
    return defineChart({
      marks: [
        barY(dayRows, {
          x: 'day',
          y: 'total',
          fill: '#0f172a',
        }),
      ],
      x: {
        scale: () => scaleBand().padding(0.18),
        axis: { label: t('dashboard.dayAxis') },
      },
      y: {
        scale: scaleLinear,
        nice: true,
        grid: true,
        axis: { label: t('dashboard.amountAxis') },
      },
      tooltip,
    })
  }, [dayRows, t])

  if (expenses.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-slate-500">
        {t('dashboard.emptyChart')}
      </p>
    )
  }

  return (
    <div className="grid gap-4">
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-slate-800">{t('dashboard.byCategory')}</h2>
        {categoryRows.length === 0 ? (
          <p className="text-slate-500">{t('dashboard.emptyChart')}</p>
        ) : (
          <>
            <Chart
              definition={pieDefinition}
              height={280}
              ariaLabel={t('dashboard.byCategory')}
            />
            <ul className="mt-3 grid grid-cols-2 gap-2 text-sm">
              {categoryRows.map((row) => (
                <li key={row.category} className="flex items-center gap-2">
                  <span
                    className="inline-block size-3 rounded-full"
                    style={{ background: CATEGORY_COLORS[row.category] }}
                  />
                  {row.label}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-slate-800">{t('dashboard.byDay')}</h2>
        <Chart definition={barDefinition} height={280} ariaLabel={t('dashboard.byDay')} />
      </section>
    </div>
  )
}
