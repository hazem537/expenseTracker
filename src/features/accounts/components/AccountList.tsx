import { useTranslation } from 'react-i18next'
import { AccountListItem } from '@/features/accounts/components/AccountListItem'
import type { Account } from '@/features/accounts/hooks/useAccounts'

interface AccountListProps {
  accounts: Account[]
  lang: string
  loading: boolean
  weights: Record<string, number>
  memberCounts: Record<string, number>
  currentUserId: string | null
  actionsDisabled?: boolean
  onAddMoney: (account: Account) => void
  onEdit: (account: Account) => void
  onDelete: (account: Account) => void
  onShare: (account: Account) => void
  onViewActivity: (account: Account) => void
  hideEmpty?: boolean
}

export function AccountList({
  accounts,
  lang,
  loading,
  weights,
  memberCounts,
  currentUserId,
  actionsDisabled = false,
  onAddMoney,
  onEdit,
  onDelete,
  onShare,
  onViewActivity,
  hideEmpty = false,
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
          memberCount={memberCounts[item.id] ?? 1}
          isCreator={Boolean(currentUserId && item.user_id === currentUserId)}
          actionsDisabled={actionsDisabled}
          onAddMoney={onAddMoney}
          onEdit={onEdit}
          onDelete={onDelete}
          onShare={onShare}
          onViewActivity={onViewActivity}
        />
      ))}
      {!loading && accounts.length === 0 && !hideEmpty ? (
        <li className="rounded-2xl border border-dashed border-gold-soft bg-surface p-6 text-muted">
          {t('accounts.empty')}
        </li>
      ) : null}
    </ul>
  )
}
