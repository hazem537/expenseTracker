import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CURRENCIES, type CurrencyCode } from '@/shared/lib/currencies'

interface CreateGroupDialogProps {
  open: boolean
  defaultCurrency: CurrencyCode
  actionsDisabled?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (input: { name: string; currency: CurrencyCode }) => Promise<void>
}

const selectClass =
  'flex h-11 w-full rounded-xl border border-gold-soft bg-surface px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-gold'

export function CreateGroupDialog({
  open,
  defaultCurrency,
  actionsDisabled = false,
  onOpenChange,
  onSubmit,
}: CreateGroupDialogProps) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState<CurrencyCode>(defaultCurrency)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) setCurrency(defaultCurrency)
  }, [open, defaultCurrency])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) {
      setError(t('expense.error'))
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onSubmit({ name: name.trim(), currency })
      setName('')
      onOpenChange(false)
    } catch {
      setError(t('expense.error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setName('')
          setError(null)
        }
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('expenseGroups.add')}</DialogTitle>
          <DialogDescription>{t('expenseGroups.formHint')}</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          <div className="space-y-1">
            <Label htmlFor="group-name">{t('expenseGroups.name')}</Label>
            <Input
              id="group-name"
              required
              disabled={busy || actionsDisabled}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="group-currency">{t('expenseGroups.currency')}</Label>
            <select
              id="group-currency"
              className={selectClass}
              value={currency}
              disabled={busy || actionsDisabled}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            >
              {CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
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
              disabled={busy || actionsDisabled || !name.trim()}
            >
              {busy ? t('app.loading') : t('app.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
