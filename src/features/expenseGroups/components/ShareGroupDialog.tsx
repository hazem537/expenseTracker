import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type {
  ExpenseGroup,
  ExpenseGroupMember,
} from '@/features/expenseGroups/hooks/useExpenseGroups'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'

interface ShareGroupDialogProps {
  group: ExpenseGroup | null
  members: ExpenseGroupMember[]
  currentUserId: string | null
  open: boolean
  actionsDisabled?: boolean
  onOpenChange: (open: boolean) => void
  onEnable: (groupId: string) => Promise<string>
  onRegenerate: (groupId: string) => Promise<string>
  onDisable: (groupId: string) => Promise<void>
  onLeave: (groupId: string) => Promise<void>
}

export function ShareGroupDialog({
  group,
  members,
  currentUserId,
  open,
  actionsDisabled = false,
  onOpenChange,
  onEnable,
  onRegenerate,
  onDisable,
  onLeave,
}: ShareGroupDialogProps) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false)

  const isCreator = Boolean(group && currentUserId && group.user_id === currentUserId)
  const canLeave = Boolean(group && currentUserId && group.user_id !== currentUserId)
  const shareCode = group?.share_code ?? null

  async function run(action: () => Promise<unknown>) {
    if (!group) return
    setBusy(true)
    setError(null)
    try {
      await action()
    } catch {
      setError(t('expense.error'))
    } finally {
      setBusy(false)
    }
  }

  async function copyCode() {
    if (!shareCode) return
    try {
      await navigator.clipboard.writeText(shareCode)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setError(t('expense.error'))
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) setLeaveConfirmOpen(false)
          onOpenChange(next)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('expenseGroups.shareTitle')}</DialogTitle>
            <DialogDescription>{t('expenseGroups.shareHint')}</DialogDescription>
          </DialogHeader>
          {group ? (
            <div className="space-y-4">
              <p className="font-semibold text-heading">{group.name}</p>

              {isCreator ? (
                <div className="space-y-3">
                  {shareCode ? (
                    <>
                      <div>
                        <p className="text-xs font-medium text-muted">{t('expenseGroups.shareCode')}</p>
                        <p className="mt-1 font-mono text-2xl tracking-widest text-heading">
                          {shareCode}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          className="rounded-xl"
                          disabled={busy || actionsDisabled}
                          onClick={() => void copyCode()}
                        >
                          {copied ? t('expenseGroups.copied') : t('expenseGroups.copyCode')}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-xl"
                          disabled={busy || actionsDisabled}
                          onClick={() => void run(() => onRegenerate(group.id))}
                        >
                          {t('expenseGroups.regenerateCode')}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-xl"
                          disabled={busy || actionsDisabled}
                          onClick={() => void run(() => onDisable(group.id))}
                        >
                          {t('expenseGroups.disableShare')}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <Button
                      type="button"
                      className="w-full rounded-xl"
                      disabled={busy || actionsDisabled}
                      onClick={() => void run(() => onEnable(group.id))}
                    >
                      {t('expenseGroups.enableShare')}
                    </Button>
                  )}
                </div>
              ) : null}

              <div>
                <p className="mb-2 text-sm font-medium text-heading">{t('expenseGroups.members')}</p>
                <ul className="space-y-1 text-sm text-muted">
                  {members.map((member) => {
                    const label =
                      member.display_name?.trim() ||
                      member.email ||
                      t('expenseGroups.memberFallback')
                    const isYou = member.user_id === currentUserId
                    const isGroupCreator = member.user_id === group.user_id
                    return (
                      <li key={member.user_id}>
                        {label}
                        {isYou ? ` (${t('expenseGroups.you')})` : null}
                        {isGroupCreator ? ` · ${t('expenseGroups.creator')}` : null}
                      </li>
                    )
                  })}
                </ul>
              </div>

              {canLeave ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-xl text-red-700"
                  disabled={busy || actionsDisabled}
                  onClick={() => setLeaveConfirmOpen(true)}
                >
                  {t('expenseGroups.leave')}
                </Button>
              ) : null}

              {error ? <p className="text-sm text-red-600">{error}</p> : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={leaveConfirmOpen}
        title={t('expenseGroups.leave')}
        description={t('expenseGroups.leaveConfirm')}
        confirmLabel={t('expenseGroups.leave')}
        onOpenChange={setLeaveConfirmOpen}
        onConfirm={async () => {
          if (!group) return
          await onLeave(group.id)
          setLeaveConfirmOpen(false)
          onOpenChange(false)
        }}
      />
    </>
  )
}
