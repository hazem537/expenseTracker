import { ArrowLeftRight, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

interface AccountsHeaderProps {
  onAddAccount: () => void
  onTransfer: () => void
  canTransfer: boolean
}

export function AccountsHeader({ onAddAccount, onTransfer, canTransfer }: AccountsHeaderProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-bold">{t('app.navAccounts')}</h1>
      <div className="flex gap-2">
        {canTransfer ? (
          <Button type="button" variant="outline" className="rounded-xl" onClick={onTransfer}>
            <ArrowLeftRight />
            {t('accounts.transfer')}
          </Button>
        ) : null}
        <Button type="button" className="rounded-xl" onClick={onAddAccount}>
          <Plus />
          {t('accounts.add')}
        </Button>
      </div>
    </div>
  )
}
