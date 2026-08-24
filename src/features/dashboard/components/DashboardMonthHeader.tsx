import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { formatMonthLabel, monthRange, shiftMonth } from '@/shared/lib/format'
import { SectionTabs } from '@/shared/ui/SectionTabs'

export type DashboardPeriodMode = 'month' | 'range'

interface DashboardPeriodFilterProps {
  mode: DashboardPeriodMode
  year: number
  monthIndex: number
  rangeStart: string
  rangeEnd: string
  lang: string
  onModeChange: (mode: DashboardPeriodMode) => void
  onMonthChange: (year: number, monthIndex: number) => void
  onRangeChange: (start: string, end: string) => void
}

export function DashboardPageTitle({
  mode,
  year,
  monthIndex,
  lang,
}: {
  mode: DashboardPeriodMode
  year: number
  monthIndex: number
  lang: string
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold uppercase tracking-[0.6px] text-gold">
        {mode === 'month' ? t('dashboard.thisMonth') : t('dashboard.customRange')}
      </p>
      <h1 className="text-2xl font-bold tracking-[-0.24px] text-heading">
        {mode === 'month' ? formatMonthLabel(year, monthIndex, lang) : t('dashboard.rangeTitle')}
      </h1>
    </div>
  )
}

export function DashboardPeriodFilter({
  mode,
  year,
  monthIndex,
  rangeStart,
  rangeEnd,
  lang,
  onModeChange,
  onMonthChange,
  onRangeChange,
}: DashboardPeriodFilterProps) {
  const { t } = useTranslation()
  const current = monthRange()

  return (
    <div className="space-y-3 rounded-2xl border border-gold-soft/70 bg-surface p-3 shadow-[0_12px_28px_rgba(201,162,39,0.08)] sm:p-4">
      <SectionTabs
        value={mode}
        onChange={onModeChange}
        items={[
          { id: 'month', label: t('dashboard.periodMonth') },
          { id: 'range', label: t('dashboard.periodRange') },
        ]}
      />
      {mode === 'month' ? (
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10 shrink-0 rounded-xl"
            aria-label={t('dashboard.prevPeriod')}
            onClick={() => {
              const next = shiftMonth(year, monthIndex, -1)
              onMonthChange(next.year, next.month)
            }}
          >
            <ChevronLeft className="rtl:rotate-180" />
          </Button>
          <p className="min-w-0 flex-1 text-center text-base font-semibold text-heading">
            {formatMonthLabel(year, monthIndex, lang)}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10 shrink-0 rounded-xl"
            aria-label={t('dashboard.nextPeriod')}
            onClick={() => {
              const next = shiftMonth(year, monthIndex, 1)
              onMonthChange(next.year, next.month)
            }}
          >
            <ChevronRight className="rtl:rotate-180" />
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted" htmlFor="dashboard-from">
              {t('dashboard.fromDate')}
            </label>
            <input
              id="dashboard-from"
              type="date"
              className="min-h-11 w-full rounded-xl border border-gold-soft bg-surface px-3 text-sm"
              value={rangeStart}
              max={rangeEnd}
              onChange={(e) => onRangeChange(e.target.value, rangeEnd)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted" htmlFor="dashboard-to">
              {t('dashboard.toDate')}
            </label>
            <input
              id="dashboard-to"
              type="date"
              className="min-h-11 w-full rounded-xl border border-gold-soft bg-surface px-3 text-sm"
              value={rangeEnd}
              min={rangeStart}
              onChange={(e) => onRangeChange(rangeStart, e.target.value)}
            />
          </div>
        </div>
      )}
      {mode === 'month' && (year !== current.year || monthIndex !== current.month) ? (
        <button
          type="button"
          className="text-sm font-medium text-heading underline"
          onClick={() => onMonthChange(current.year, current.month)}
        >
          {t('dashboard.jumpThisMonth')}
        </button>
      ) : null}
    </div>
  )
}
