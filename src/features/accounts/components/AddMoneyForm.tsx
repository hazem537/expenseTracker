import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Account } from '@/features/accounts/hooks/useAccounts'

interface AddMoneyFormProps {
  account: Account
  onSubmit: (amount: number) => Promise<void>
  onCancel: () => void
}

export function AddMoneyForm({ account, onSubmit, onCancel }: AddMoneyFormProps) {
  const { t } = useTranslation()
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0) {
      setError(t('expense.error'))
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSubmit(value)
    } catch {
      setError(t('expense.error'))
      setSaving(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
      <p className="text-sm text-neutral-500">
        {account.name} ({account.currency})
      </p>
      <div className="space-y-1">
        <Label htmlFor="deposit-amount">{t('expense.amount')}</Label>
        <Input
          id="deposit-amount"
          type="number"
          min="0.01"
          step="0.01"
          inputMode="decimal"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex gap-2">
        <Button type="submit" disabled={saving} className="min-h-11 flex-1 rounded-xl">
          {t('app.save')}
        </Button>
        <Button type="button" variant="secondary" className="min-h-11 rounded-xl" onClick={onCancel}>
          {t('app.cancel')}
        </Button>
      </div>
    </form>
  )
}
