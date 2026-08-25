import { useState } from 'react'
import { Archive, ArchiveRestore, ArrowLeft, Plus, Share2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useAccounts } from '@/features/accounts/hooks/useAccounts'
import { ExpenseGroupExpensesTable } from '@/features/expenseGroups/components/ExpenseGroupExpensesTable'
import { GroupExpenseForm } from '@/features/expenseGroups/components/GroupExpenseForm'
import { ShareGroupDialog } from '@/features/expenseGroups/components/ShareGroupDialog'
import { useExpenseGroupDetail } from '@/features/expenseGroups/hooks/useExpenseGroupDetail'
import type {
  ExpenseGroup,
  ExpenseGroupMember,
} from '@/features/expenseGroups/hooks/useExpenseGroups'
import { useExpenses } from '@/features/expenses/hooks/useExpenses'
import { useProfile } from '@/features/settings'
import { DEFAULT_CURRENCY } from '@/shared/lib/currencies'
import { useOnlineStatus } from '@/shared/lib/online'
import { MoneyText } from '@/shared/ui/HideMoney'

interface ExpenseGroupDetailViewProps {
  groupId: string
  onBack: () => void
  listMembers?: ExpenseGroupMember[]
  onEnableSharing: (groupId: string) => Promise<string>
  onRegenerateShareCode: (groupId: string) => Promise<string>
  onDisableSharing: (groupId: string) => Promise<void>
  onLeave: (groupId: string) => Promise<void>
  onArchive: (groupId: string, archived: boolean) => Promise<void>
  onLeft?: () => void
}

export function ExpenseGroupDetailView({
  groupId,
  onBack,
  listMembers,
  onEnableSharing,
  onRegenerateShareCode,
  onDisableSharing,
  onLeave,
  onArchive,
  onLeft,
}: ExpenseGroupDetailViewProps) {
  const { t, i18n } = useTranslation()
  const online = useOnlineStatus()
  const lang = i18n.language
  const { profile } = useProfile()
  const { accounts } = useAccounts()
  const { createExpense } = useExpenses()
  const {
    group,
    members,
    expenses,
    memberLabels,
    personPaid,
    groupTotal,
    currentUserId,
    loading,
    error,
    reload,
  } = useExpenseGroupDetail(groupId)

  const [addOpen, setAddOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  const displayMembers = members.length > 0 ? members : (listMembers ?? [])
  const defaultCurrency = profile?.default_currency ?? group?.currency ?? DEFAULT_CURRENCY
  const showNeedCache = !online && !loading && !group && !error

  function personName(userId: string) {
    return (
      memberLabels[userId] ??
      (userId === currentUserId ? t('expenseGroups.you') : t('expenseGroups.memberFallback'))
    )
  }

  const shareGroupLive: ExpenseGroup | null = group

  return (
    <div className="space-y-4 sm:space-y-6">
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full rounded-xl sm:w-auto"
        onClick={onBack}
      >
        <ArrowLeft />
        {t('expenseGroups.backToList')}
      </Button>

      {loading ? <p>{t('app.loading')}</p> : null}
      {showNeedCache ? <p className="text-muted">{t('offline.needCache')}</p> : null}
      {error && online ? <p className="text-red-600">{t('expense.error')}</p> : null}
      {!loading && !group && !showNeedCache ? (
        <p className="text-muted">{t('expenseGroups.detailNotFound')}</p>
      ) : null}

      {group ? (
        <>
          <div className="space-y-3">
            <div>
              <h2 className="text-xl font-bold leading-tight text-heading sm:text-2xl">
                {group.name}
                {group.archived ? (
                  <span className="ms-2 align-middle rounded-full bg-muted/40 px-2 py-0.5 text-xs font-medium text-muted">
                    {t('expenseGroups.archivedBadge')}
                  </span>
                ) : null}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {group.currency} ·{' '}
                {t('expenseGroups.memberCount', { count: displayMembers.length || 1 })}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-xl"
                disabled={!online}
                title={!online ? t('offline.actionDisabled') : undefined}
                onClick={() => setShareOpen(true)}
              >
                <Share2 />
                {t('expenseGroups.share')}
              </Button>
              {currentUserId && group.user_id === currentUserId ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl"
                  disabled={!online}
                  title={!online ? t('offline.actionDisabled') : undefined}
                  onClick={() => void onArchive(group.id, !group.archived)}
                >
                  {group.archived ? <ArchiveRestore /> : <Archive />}
                  {group.archived ? t('expenseGroups.unarchive') : t('expenseGroups.archive')}
                </Button>
              ) : null}
              <Button
                type="button"
                className="h-11 rounded-xl"
                disabled={!online}
                title={!online ? t('offline.actionDisabled') : undefined}
                onClick={() => setAddOpen(true)}
              >
                <Plus />
                {t('expenseGroups.addExpense')}
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-gold-soft/70 bg-surface p-4">
            <p className="text-xs text-muted">{t('expenseGroups.groupTotal')}</p>
            <p className="text-2xl font-bold text-heading">
              <MoneyText amount={groupTotal} lang={lang} currency={group.currency} />
            </p>
          </div>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-heading">{t('expenseGroups.byPerson')}</h3>
            {personPaid.length === 0 ? (
              <p className="text-sm text-muted">{t('expenseGroups.noExpenses')}</p>
            ) : (
              <ul className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
                {personPaid.map((row) => (
                  <li
                    key={row.user_id}
                    className="w-[9.5rem] shrink-0 rounded-xl border border-gold-soft/50 bg-surface px-3 py-2 sm:w-auto"
                  >
                    <p className="truncate text-sm font-medium text-heading" title={row.label}>
                      {row.label}
                      {row.user_id === currentUserId
                        ? ` (${t('expenseGroups.you')})`
                        : null}
                    </p>
                    <p className="mt-1 font-semibold">
                      <MoneyText amount={row.totalPaid} lang={lang} currency={group.currency} />
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-heading">{t('expenseGroups.expenses')}</h3>
            <ExpenseGroupExpensesTable
              expenses={expenses}
              groupCurrency={group.currency}
              lang={lang}
              personName={personName}
            />
          </section>

          <GroupExpenseForm
            open={addOpen}
            groupId={group.id}
            groupCurrency={group.currency}
            accounts={accounts}
            defaultCurrency={defaultCurrency}
            actionsDisabled={!online}
            onOpenChange={setAddOpen}
            onSubmit={async (input) => {
              await createExpense(input)
              await reload()
            }}
          />

          <ShareGroupDialog
            group={shareGroupLive}
            members={displayMembers}
            currentUserId={currentUserId}
            open={shareOpen}
            actionsDisabled={!online}
            onOpenChange={setShareOpen}
            onEnable={onEnableSharing}
            onRegenerate={onRegenerateShareCode}
            onDisable={onDisableSharing}
            onLeave={async (id) => {
              await onLeave(id)
              onLeft?.()
            }}
          />
        </>
      ) : null}
    </div>
  )
}
