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
import type { Account, AccountMember } from '@/features/accounts/hooks/useAccounts'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'

interface ShareAccountDialogProps {
  account: Account | null
  members: AccountMember[]
  currentUserId: string | null
  open: boolean
  actionsDisabled?: boolean
  onOpenChange: (open: boolean) => void
  onEnable: (accountId: string) => Promise<string>
  onRegenerate: (accountId: string) => Promise<string>
  onDisable: (accountId: string) => Promise<void>
  onLeave: (accountId: string) => Promise<void>
}

export function ShareAccountDialog({
  account,
  members,
  currentUserId,
  open,
  actionsDisabled = false,
  onOpenChange,
  onEnable,
  onRegenerate,
  onDisable,
  onLeave,
}: ShareAccountDialogProps) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false)

  const isCreator = Boolean(account && currentUserId && account.user_id === currentUserId)
  const canLeave = Boolean(account && currentUserId && account.user_id !== currentUserId)
  const shareCode = account?.share_code ?? null

  async function run(action: () => Promise<unknown>) {
    if (!account) return
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
            <DialogTitle>{t('accounts.shareTitle')}</DialogTitle>
            <DialogDescription>{t('accounts.shareHint')}</DialogDescription>
          </DialogHeader>
          {account ? (
            <div className="space-y-4">
              <p className="font-semibold text-heading">{account.name}</p>

              {isCreator ? (
                <div className="space-y-3">
                  {shareCode ? (
                    <>
                      <div>
                        <p className="text-xs font-medium text-muted">{t('accounts.shareCode')}</p>
                        <p className="mt-1 font-mono text-2xl tracking-widest text-heading">{shareCode}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          className="rounded-xl"
                          disabled={busy || actionsDisabled}
                          onClick={() => void copyCode()}
                        >
                          {copied ? t('accounts.copied') : t('accounts.copyCode')}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-xl"
                          disabled={busy || actionsDisabled}
                          onClick={() => void run(() => onRegenerate(account.id))}
                        >
                          {t('accounts.regenerateCode')}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-xl"
                          disabled={busy || actionsDisabled}
                          onClick={() => void run(() => onDisable(account.id))}
                        >
                          {t('accounts.disableShare')}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <Button
                      type="button"
                      className="w-full rounded-xl"
                      disabled={busy || actionsDisabled}
                      onClick={() => void run(() => onEnable(account.id))}
                    >
                      {t('accounts.enableShare')}
                    </Button>
                  )}
                </div>
              ) : null}

              <div>
                <p className="mb-2 text-sm font-medium text-heading">{t('accounts.members')}</p>
                <ul className="space-y-1 text-sm text-muted">
                  {members.map((member) => {
                    const label =
                      member.display_name?.trim() ||
                      member.email ||
                      t('accounts.memberFallback')
                    const isYou = member.user_id === currentUserId
                    const isAccountCreator = member.user_id === account.user_id
                    return (
                      <li key={member.user_id}>
                        {label}
                        {isYou ? ` (${t('accounts.you')})` : null}
                        {isAccountCreator ? ` · ${t('accounts.creator')}` : null}
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
                  {t('accounts.leave')}
                </Button>
              ) : null}

              {error ? <p className="text-sm text-red-600">{error}</p> : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={leaveConfirmOpen}
        title={t('accounts.leave')}
        description={t('accounts.leaveConfirm')}
        confirmLabel={t('accounts.leave')}
        onOpenChange={setLeaveConfirmOpen}
        onConfirm={async () => {
          if (!account) return
          await onLeave(account.id)
          setLeaveConfirmOpen(false)
          onOpenChange(false)
        }}
      />
    </>
  )
}
