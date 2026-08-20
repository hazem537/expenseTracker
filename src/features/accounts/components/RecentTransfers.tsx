import { useTranslation } from 'react-i18next'
import type { Account, Transfer } from '@/features/accounts/hooks/useAccounts'
import { formatAmount, formatDate } from '@/shared/lib/format'

interface RecentTransfersProps {
  transfers: Transfer[]
  accounts: Account[]
  lang: string
}

export function RecentTransfers({ transfers, accounts, lang }: RecentTransfersProps) {
  const { t } = useTranslation()
  if (transfers.length === 0) return null

  return (
    <section>
      <h2 className="mb-2 font-semibold">{t('accounts.recentTransfers')}</h2>
      <ul className="space-y-2">
        {transfers.map((item) => {
          const from = accounts.find((a) => a.id === item.from_account_id)
          const to = accounts.find((a) => a.id === item.to_account_id)
          return (
            <li key={item.id} className="rounded-xl bg-white p-3 text-sm shadow-sm">
              {from?.name} → {to?.name} · {formatDate(item.occurred_on, lang)}
              <div className="mt-1 text-slate-600">
                {formatAmount(item.from_amount, lang, from?.currency)} →{' '}
                {formatAmount(item.to_amount, lang, to?.currency)}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
