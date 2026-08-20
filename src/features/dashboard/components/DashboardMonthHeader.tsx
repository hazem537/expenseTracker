import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { formatMonthLabel } from '@/shared/lib/format'

interface DashboardMonthHeaderProps {
  year: number
  monthIndex: number
  lang: string
  onAddExpense: () => void
}

export function DashboardMonthHeader({
  year,
  monthIndex,
  lang,
  onAddExpense,
}: DashboardMonthHeaderProps) {
  const { t } = useTranslation()

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-[0.6px] text-gold">
          {t('dashboard.thisMonth')}
        </p>
        <h1 className="text-2xl font-bold tracking-[-0.24px] text-heading">
          {formatMonthLabel(year, monthIndex, lang)}
        </h1>
      </div>
      <Button type="button" className="hidden rounded-xl md:inline-flex" onClick={onAddExpense}>
        <Plus />
        {t('app.add')}
      </Button>
    </div>
  )
}
