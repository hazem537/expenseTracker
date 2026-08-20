import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CURRENCIES, type CurrencyCode } from '@/shared/lib/currencies'

export interface AccountFormValues {
  name: string
  currency: CurrencyCode
  openingBalance: number
}

interface AccountFormProps {
  defaultCurrency: CurrencyCode
  initial?: { name: string; currency: CurrencyCode; balance: number } | null
  onSubmit: (values: AccountFormValues) => Promise<void>
  onCancel: () => void
}

const selectClass =
  'flex h-11 w-full rounded-xl border border-gold-soft bg-surface px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-gold'

export function AccountForm({ defaultCurrency, initial, onSubmit, onCancel }: AccountFormProps) {
  const { t } = useTranslation()
  const [name, setName] = useState(initial?.name ?? '')
  const [currency, setCurrency] = useState<CurrencyCode>(initial?.currency ?? defaultCurrency)
  const [opening, setOpening] = useState(initial ? String(initial.balance) : '0')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initial) {
      setName(initial.name)
      setCurrency(initial.currency)
      setOpening(String(initial.balance))
      return
    }
    setCurrency(defaultCurrency)
  }, [defaultCurrency, initial])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const openingBalance = Number(opening)
    if (!name.trim() || !Number.isFinite(openingBalance) || openingBalance < 0) {
      setError(t('expense.error'))
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSubmit({ name: name.trim(), currency, openingBalance })
    } catch {
      setError(t('expense.error'))
      setSaving(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
      <div className="space-y-1">
        <Label htmlFor="account-name">{t('accounts.name')}</Label>
        <Input
          id="account-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="account-currency">{t('accounts.currency')}</Label>
        <select
          id="account-currency"
          className={selectClass}
          value={currency}
          onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
        >
          {CURRENCIES.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="account-opening">{initial ? t('accounts.balance') : t('accounts.opening')}</Label>
        <Input
          id="account-opening"
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          value={opening}
          onChange={(e) => setOpening(e.target.value)}
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
