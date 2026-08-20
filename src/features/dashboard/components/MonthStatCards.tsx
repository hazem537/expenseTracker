import { useTranslation } from 'react-i18next'
import { formatLedger } from '@/features/dashboard/lib/formatLedger'
import { dashboardCard } from '@/features/dashboard/lib/styles'

interface MonthStatCardsProps {
  totalSpent: number
  expenseCount: number
  currency: string
  lang: string
}

export function MonthStatCards({ totalSpent, expenseCount, currency, lang }: MonthStatCardsProps) {
  const { t } = useTranslation()

  return (
    <div className="flex gap-4">
      <article className={`${dashboardCard} min-w-0 flex-1 rounded-xl p-[17px]`}>
        <p className="text-sm leading-5 text-[#45464d]">{t('dashboard.totalSpent')}</p>
        <p className="mt-1 text-xl font-bold leading-7 text-black">
          {formatLedger(totalSpent, currency, lang)}
        </p>
      </article>
      <article className={`${dashboardCard} min-w-0 flex-1 rounded-xl p-[17px]`}>
        <p className="text-sm leading-5 text-[#45464d]">{t('dashboard.count')}</p>
        <p className="mt-1 text-xl font-bold leading-7 text-black">{expenseCount}</p>
      </article>
    </div>
  )
}
