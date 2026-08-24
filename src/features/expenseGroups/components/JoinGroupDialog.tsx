import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

interface JoinGroupDialogProps {
  open: boolean
  actionsDisabled?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (code: string) => Promise<unknown>
}

export function JoinGroupDialog({
  open,
  actionsDisabled = false,
  onOpenChange,
  onSubmit,
}: JoinGroupDialogProps) {
  const { t } = useTranslation()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await onSubmit(code)
      setCode('')
      onOpenChange(false)
    } catch {
      setError(t('expenseGroups.joinError'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setCode('')
          setError(null)
        }
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('expenseGroups.joinTitle')}</DialogTitle>
          <DialogDescription>{t('expenseGroups.joinHint')}</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          <div>
            <Label htmlFor="join-group-code">{t('expenseGroups.joinCode')}</Label>
            <input
              id="join-group-code"
              className="mt-2 min-h-12 w-full rounded-xl border border-gold-soft bg-surface px-3 font-mono text-base uppercase tracking-widest"
              value={code}
              disabled={busy || actionsDisabled}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={16}
              autoComplete="off"
              required
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl"
              disabled={busy}
              onClick={() => onOpenChange(false)}
            >
              {t('app.cancel')}
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-xl"
              disabled={busy || actionsDisabled || !code.trim()}
            >
              {t('expenseGroups.joinSubmit')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
