import { ArrowLeftRight, Plus, UserPlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

interface AccountsHeaderProps {
  onAddAccount: () => void
  onTransfer: () => void
  onJoin: () => void
  canTransfer: boolean
  actionsDisabled?: boolean
}

export function AccountsHeader({
  onAddAccount,
  onTransfer,
  onJoin,
  canTransfer,
  actionsDisabled = false,
}: AccountsHeaderProps) {
  const { t } = useTranslation()
  const disabledTitle = actionsDisabled ? t('offline.actionDisabled') : undefined

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-bold text-heading">{t('accounts.title')}</h1>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          disabled={actionsDisabled}
          title={disabledTitle}
          aria-label={actionsDisabled ? t('offline.actionDisabled') : t('accounts.join')}
          onClick={onJoin}
        >
          <UserPlus />
          {t('accounts.join')}
        </Button>
        {canTransfer ? (
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={actionsDisabled}
            title={disabledTitle}
            aria-label={actionsDisabled ? t('offline.actionDisabled') : t('accounts.transfer')}
            onClick={onTransfer}
          >
            <ArrowLeftRight />
            {t('accounts.transfer')}
          </Button>
        ) : null}
        <Button
          type="button"
          className="rounded-xl"
          disabled={actionsDisabled}
          title={disabledTitle}
          aria-label={actionsDisabled ? t('offline.actionDisabled') : t('accounts.add')}
          onClick={onAddAccount}
        >
          <Plus />
          {t('accounts.add')}
        </Button>
      </div>
    </div>
  )
}
