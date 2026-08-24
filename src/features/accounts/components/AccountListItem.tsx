import { Pencil, Plus, Share2, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import type { Account } from '@/features/accounts/hooks/useAccounts'
import { MoneyText } from '@/shared/ui/HideMoney'
import { ExpandableRecord } from '@/shared/ui/ExpandableRecord'

interface AccountListItemProps {
  account: Account
  lang: string
  weight: number | null
  memberCount: number
  isCreator: boolean
  actionsDisabled?: boolean
  expanded: boolean
  onToggle: () => void
  onAddMoney: (account: Account) => void
  onEdit: (account: Account) => void
  onDelete: (account: Account) => void
  onShare: (account: Account) => void
  onViewActivity: (account: Account) => void
}

export function AccountListItem({
  account,
  lang,
  weight,
  memberCount,
  isCreator,
  actionsDisabled = false,
  expanded,
  onToggle,
  onAddMoney,
  onEdit,
  onDelete,
  onShare,
  onViewActivity,
}: AccountListItemProps) {
  const { t } = useTranslation()
  const disabledTitle = actionsDisabled ? t('offline.actionDisabled') : undefined
  const isShared = memberCount > 1 || Boolean(account.share_code)

  return (
    <ExpandableRecord
      expanded={expanded}
      onToggle={onToggle}
      summary={
        <p className="truncate font-semibold">
          {account.name}
          {isShared ? (
            <span className="ms-2 rounded-full bg-gold-soft/50 px-2 py-0.5 text-xs font-medium text-heading">
              {t('accounts.sharedBadge')}
            </span>
          ) : null}
        </p>
      }
      value={
        <p className="text-sm font-semibold">
          <MoneyText amount={account.balance} lang={lang} currency={account.currency} />
        </p>
      }
    >
      <p className="text-sm text-muted">{account.currency}</p>
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-xl bg-gold-soft/30 p-2">
          <p className="text-xs text-muted">{t('accounts.weight')}</p>
          <p className="font-semibold">{weight == null ? '—' : `${weight.toFixed(1)}%`}</p>
        </div>
        <div className="rounded-xl bg-gold-soft/30 p-2">
          <p className="text-xs text-muted">{t('accounts.balance')}</p>
          <p className="text-sm font-semibold">
            <MoneyText amount={account.balance} lang={lang} currency={account.currency} />
          </p>
        </div>
      </div>
      {weight != null ? (
        <div className="h-1.5 overflow-hidden rounded-full bg-gold-soft/40">
          <div className="h-full rounded-full bg-navy" style={{ width: `${Math.min(weight, 100)}%` }} />
        </div>
      ) : null}
      <button
        type="button"
        className="text-xs font-medium text-muted underline"
        onClick={() => onViewActivity(account)}
      >
        {t('accounts.viewActivity')}
      </button>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className="min-h-10 flex-1 rounded-xl"
          disabled={actionsDisabled}
          title={disabledTitle}
          onClick={() => onAddMoney(account)}
        >
          <Plus />
          {t('accounts.addMoney')}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-10 flex-1 rounded-xl"
          disabled={actionsDisabled}
          title={disabledTitle}
          onClick={() => onShare(account)}
        >
          <Share2 />
          {t('accounts.share')}
        </Button>
        {isCreator ? (
          <Button
            type="button"
            variant="outline"
            className="min-h-10 flex-1 rounded-xl"
            disabled={actionsDisabled}
            title={disabledTitle}
            onClick={() => onEdit(account)}
          >
            <Pencil />
            {t('app.edit')}
          </Button>
        ) : null}
        {isCreator ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10 shrink-0 text-red-700"
            aria-label={actionsDisabled ? t('offline.actionDisabled') : t('app.delete')}
            disabled={actionsDisabled}
            title={disabledTitle}
            onClick={() => onDelete(account)}
          >
            <Trash2 />
          </Button>
        ) : null}
      </div>
    </ExpandableRecord>
  )
}
