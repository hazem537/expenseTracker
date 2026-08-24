import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CreateGroupDialog } from '@/features/expenseGroups/components/CreateGroupDialog'
import { ExpenseGroupDetailView } from '@/features/expenseGroups/components/ExpenseGroupDetailView'
import { ExpenseGroupListItem } from '@/features/expenseGroups/components/ExpenseGroupListItem'
import { ExpenseGroupsHeader } from '@/features/expenseGroups/components/ExpenseGroupsHeader'
import { JoinGroupDialog } from '@/features/expenseGroups/components/JoinGroupDialog'
import { ShareGroupDialog } from '@/features/expenseGroups/components/ShareGroupDialog'
import {
  useExpenseGroups,
  type ExpenseGroup,
} from '@/features/expenseGroups/hooks/useExpenseGroups'
import { useProfile } from '@/features/settings'
import { useOnlineStatus } from '@/shared/lib/online'
import { isSupabaseConfigured } from '@/shared/lib/supabase'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { SetupNotice } from '@/shared/ui/SetupNotice'

export function ExpenseGroupsPage({ hideTitle = false }: { hideTitle?: boolean }) {
  const { t } = useTranslation()
  const online = useOnlineStatus()
  const { profile } = useProfile()
  const {
    groups,
    membersByGroup,
    currentUserId,
    loading,
    error,
    createGroup,
    enableSharing,
    regenerateShareCode,
    disableSharing,
    joinByShareCode,
    leaveGroup,
    deleteGroup,
  } = useExpenseGroups()

  const defaultCurrency = profile?.default_currency ?? 'USD'

  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)
  const [shareGroup, setShareGroup] = useState<ExpenseGroup | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ExpenseGroup | null>(null)
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const memberCounts = useMemo(() => {
    const next: Record<string, number> = {}
    for (const group of groups) {
      next[group.id] = membersByGroup[group.id]?.length ?? 1
    }
    return next
  }, [groups, membersByGroup])

  const shareGroupLive = shareGroup
    ? (groups.find((g) => g.id === shareGroup.id) ?? shareGroup)
    : null

  if (activeGroupId) {
    return (
      <div className="space-y-6">
        {!isSupabaseConfigured ? <SetupNotice /> : null}
        <ExpenseGroupDetailView
          groupId={activeGroupId}
          listMembers={membersByGroup[activeGroupId]}
          onBack={() => setActiveGroupId(null)}
          onEnableSharing={enableSharing}
          onRegenerateShareCode={regenerateShareCode}
          onDisableSharing={disableSharing}
          onLeave={leaveGroup}
          onLeft={() => setActiveGroupId(null)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {!isSupabaseConfigured ? <SetupNotice /> : null}
      <ExpenseGroupsHeader
        hideTitle={hideTitle}
        actionsDisabled={!online}
        onAdd={() => setCreateOpen(true)}
        onJoin={() => setJoinOpen(true)}
      />
      {loading ? <p>{t('app.loading')}</p> : null}
      {error && online ? <p className="text-red-600">{t('expense.error')}</p> : null}
      {actionError ? <p className="text-red-600">{actionError}</p> : null}
      {!loading && groups.length === 0 ? (
        <p className="text-muted">{t('expenseGroups.empty')}</p>
      ) : null}
      <ul className="space-y-3">
        {groups.map((group) => (
          <ExpenseGroupListItem
            key={group.id}
            group={group}
            memberCount={memberCounts[group.id] ?? 1}
            isCreator={Boolean(currentUserId && group.user_id === currentUserId)}
            actionsDisabled={!online}
            onOpen={(g) => setActiveGroupId(g.id)}
            onShare={setShareGroup}
            onDelete={setDeleteTarget}
          />
        ))}
      </ul>

      <CreateGroupDialog
        open={createOpen}
        defaultCurrency={defaultCurrency}
        actionsDisabled={!online}
        onOpenChange={setCreateOpen}
        onSubmit={createGroup}
      />
      <JoinGroupDialog
        open={joinOpen}
        actionsDisabled={!online}
        onOpenChange={setJoinOpen}
        onSubmit={joinByShareCode}
      />
      <ShareGroupDialog
        group={shareGroupLive}
        members={shareGroupLive ? (membersByGroup[shareGroupLive.id] ?? []) : []}
        currentUserId={currentUserId}
        open={shareGroup != null}
        actionsDisabled={!online}
        onOpenChange={(open) => {
          if (!open) setShareGroup(null)
        }}
        onEnable={enableSharing}
        onRegenerate={regenerateShareCode}
        onDisable={disableSharing}
        onLeave={leaveGroup}
      />
      <ConfirmDialog
        open={deleteTarget != null}
        description={t('expenseGroups.confirmDelete')}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        onConfirm={async () => {
          if (!deleteTarget) return
          setActionError(null)
          try {
            await deleteGroup(deleteTarget.id)
          } catch {
            setActionError(t('expense.error'))
          }
        }}
      />
    </div>
  )
}
