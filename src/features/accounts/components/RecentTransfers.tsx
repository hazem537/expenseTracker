import { useTranslation } from 'react-i18next'
import type { Account, Transfer } from '@/features/accounts/hooks/useAccounts'
import { formatDate } from '@/shared/lib/format'
import { MoneyText } from '@/shared/ui/HideMoney'

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
            <li key={item.id} className="rounded-xl border border-gold-soft/50 bg-surface p-3 text-sm">
              {from?.name} → {to?.name} · {formatDate(item.occurred_on, lang)}
              <div className="mt-1 text-muted">
                <MoneyText amount={item.from_amount} lang={lang} currency={from?.currency} /> →{' '}
                <MoneyText amount={item.to_amount} lang={lang} currency={to?.currency} />
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
