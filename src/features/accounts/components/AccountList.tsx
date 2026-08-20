import { useTranslation } from 'react-i18next'
import { AccountListItem } from '@/features/accounts/components/AccountListItem'
import type { Account } from '@/features/accounts/hooks/useAccounts'

interface AccountListProps {
  accounts: Account[]
  lang: string
  loading: boolean
  weights: Record<string, number>
  onAddMoney: (account: Account) => void
  onEdit: (account: Account) => void
  onDelete: (account: Account) => void
}

export function AccountList({
  accounts,
  lang,
  loading,
  weights,
  onAddMoney,
  onEdit,
  onDelete,
}: AccountListProps) {
  const { t } = useTranslation()

  return (
    <ul className="space-y-2">
      {accounts.map((item) => (
        <AccountListItem
          key={item.id}
          account={item}
          lang={lang}
          weight={weights[item.id] ?? null}
          onAddMoney={onAddMoney}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
      {!loading && accounts.length === 0 ? (
        <li className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-slate-500">
          {t('accounts.empty')}
        </li>
      ) : null}
    </ul>
  )
}
