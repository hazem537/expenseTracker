import { useTranslation } from 'react-i18next'
import { dashboardCard } from '@/features/dashboard/lib/styles'
import { MoneyText } from '@/shared/ui/HideMoney'

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
        <p className="text-sm leading-5 text-muted">{t('dashboard.totalSpent')}</p>
        <p className="mt-1 text-xl font-bold leading-7 text-heading">
          <MoneyText amount={totalSpent} lang={lang} currency={currency} ledger />
        </p>
      </article>
      <article className={`${dashboardCard} min-w-0 flex-1 rounded-xl p-[17px]`}>
        <p className="text-sm leading-5 text-muted">{t('dashboard.count')}</p>
        <p className="mt-1 text-xl font-bold leading-7 text-heading">{expenseCount}</p>
      </article>
    </div>
  )
}
