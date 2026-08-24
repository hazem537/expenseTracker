import { Archive, ArchiveRestore, Share2, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import type { ExpenseGroup } from '@/features/expenseGroups/hooks/useExpenseGroups'

interface ExpenseGroupListItemProps {
  group: ExpenseGroup
  memberCount: number
  isCreator: boolean
  actionsDisabled?: boolean
  onOpen: (group: ExpenseGroup) => void
  onShare: (group: ExpenseGroup) => void
  onArchive: (group: ExpenseGroup) => void
  onDelete: (group: ExpenseGroup) => void
}

export function ExpenseGroupListItem({
  group,
  memberCount,
  isCreator,
  actionsDisabled = false,
  onOpen,
  onShare,
  onArchive,
  onDelete,
}: ExpenseGroupListItemProps) {
  const { t } = useTranslation()
  const disabledTitle = actionsDisabled ? t('offline.actionDisabled') : undefined
  const isShared = memberCount > 1 || Boolean(group.share_code)

  return (
    <li className="space-y-3 rounded-2xl border border-gold-soft/70 bg-surface p-4 shadow-[0_12px_28px_rgba(201,162,39,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">
            <button
              type="button"
              className="text-start underline-offset-2 hover:underline"
              onClick={() => onOpen(group)}
            >
              {group.name}
            </button>
            {isShared ? (
              <span className="ms-2 rounded-full bg-gold-soft/50 px-2 py-0.5 text-xs font-medium text-heading">
                {t('expenseGroups.sharedBadge')}
              </span>
            ) : null}
            {group.archived ? (
              <span className="ms-2 rounded-full bg-muted/40 px-2 py-0.5 text-xs font-medium text-muted">
                {t('expenseGroups.archivedBadge')}
              </span>
            ) : null}
          </p>
          <p className="text-sm text-muted">
            {group.currency} · {t('expenseGroups.memberCount', { count: memberCount })}
          </p>
          <button
            type="button"
            className="mt-1 text-xs font-medium text-muted underline"
            onClick={() => onOpen(group)}
          >
            {t('expenseGroups.open')}
          </button>
        </div>
        {isCreator ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10 shrink-0 text-red-700"
            aria-label={actionsDisabled ? t('offline.actionDisabled') : t('app.delete')}
            disabled={actionsDisabled}
            title={disabledTitle}
            onClick={() => onDelete(group)}
          >
            <Trash2 />
          </Button>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className="min-h-10 flex-1 rounded-xl"
          disabled={actionsDisabled}
          title={disabledTitle}
          onClick={() => onShare(group)}
        >
          <Share2 />
          {t('expenseGroups.share')}
        </Button>
        {isCreator ? (
          <Button
            type="button"
            variant="outline"
            className="min-h-10 flex-1 rounded-xl"
            disabled={actionsDisabled}
            title={disabledTitle}
            onClick={() => onArchive(group)}
          >
            {group.archived ? <ArchiveRestore /> : <Archive />}
            {group.archived ? t('expenseGroups.unarchive') : t('expenseGroups.archive')}
          </Button>
        ) : null}
      </div>
    </li>
  )
}
