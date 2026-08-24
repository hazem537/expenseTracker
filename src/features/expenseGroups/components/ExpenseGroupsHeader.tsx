import { Plus, UserPlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

interface ExpenseGroupsHeaderProps {
  onAdd: () => void
  onJoin: () => void
  actionsDisabled?: boolean
  hideTitle?: boolean
}

export function ExpenseGroupsHeader({
  onAdd,
  onJoin,
  actionsDisabled = false,
  hideTitle = false,
}: ExpenseGroupsHeaderProps) {
  const { t } = useTranslation()
  const disabledTitle = actionsDisabled ? t('offline.actionDisabled') : undefined

  return (
    <div className="space-y-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:space-y-0">
      {hideTitle ? null : (
        <h1 className="text-xl font-bold text-heading sm:text-2xl">{t('expenseGroups.title')}</h1>
      )}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-xl"
          disabled={actionsDisabled}
          title={disabledTitle}
          aria-label={actionsDisabled ? t('offline.actionDisabled') : t('expenseGroups.join')}
          onClick={onJoin}
        >
          <UserPlus />
          {t('expenseGroups.join')}
        </Button>
        <Button
          type="button"
          className="h-11 rounded-xl"
          disabled={actionsDisabled}
          title={disabledTitle}
          aria-label={actionsDisabled ? t('offline.actionDisabled') : t('expenseGroups.add')}
          onClick={onAdd}
        >
          <Plus />
          {t('expenseGroups.add')}
        </Button>
      </div>
    </div>
  )
}
