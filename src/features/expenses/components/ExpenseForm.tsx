import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Account } from '@/features/accounts/hooks/useAccounts'
import { CATEGORIES, type Category } from '@/features/expenses/lib/categories'
import type { Expense, ExpenseInput } from '@/features/expenses/hooks/useExpenses'
import type { CurrencyCode } from '@/shared/lib/currencies'

interface ExpenseFormProps {
  initial?: Expense | null
  accounts: Account[]
  defaultCurrency: CurrencyCode
  onSubmit: (input: ExpenseInput) => Promise<void>
  onCancel: () => void
}

const selectClass =
  'mt-1 flex h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-neutral-400'

export function ExpenseForm({
  initial,
  accounts,
  defaultCurrency,
  onSubmit,
  onCancel,
}: ExpenseFormProps) {
  const { t } = useTranslation()
  const [accountId, setAccountId] = useState(initial?.account_id ?? accounts[0]?.id ?? '')
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [amountBase, setAmountBase] = useState(initial ? String(initial.amount_base) : '')
  const [category, setCategory] = useState<Category>(initial?.category ?? 'food')
  const [occurredOn, setOccurredOn] = useState(
    initial?.occurred_on ?? new Date().toISOString().slice(0, 10),
  )
  const [note, setNote] = useState(initial?.note ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const account = accounts.find((item) => item.id === accountId)
  const needsFx = Boolean(account && account.currency !== defaultCurrency)

  useEffect(() => {
    if (!needsFx) setAmountBase(amount)
  }, [amount, needsFx])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const value = Number(amount)
    const base = needsFx ? Number(amountBase) : value
    if (!accountId || !Number.isFinite(value) || value <= 0 || !Number.isFinite(base) || base <= 0) {
      setError(t('expense.error'))
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSubmit({
        account_id: accountId,
        amount: value,
        amount_base: base,
        fx_rate: value === 0 ? 1 : base / value,
        category,
        occurred_on: occurredOn,
        note,
      })
    } catch (err) {
      setError(
        err instanceof Error && err.message === 'Insufficient funds'
          ? t('accounts.insufficient')
          : t('expense.error'),
      )
      setSaving(false)
    }
  }

  if (accounts.length === 0) {
    return <p className="text-neutral-600">{t('accounts.needAccountFirst')}</p>
  }

  return (
    <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
      <div className="space-y-1">
        <Label htmlFor="account">{t('expense.account')}</Label>
        <select
          id="account"
          className={selectClass}
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
        >
          {accounts.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} ({item.currency})
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="amount">
          {t('expense.amount')} {account ? `(${account.currency})` : ''}
        </Label>
        <Input
          id="amount"
          type="number"
          min="0.01"
          step="0.01"
          inputMode="decimal"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      {needsFx ? (
        <div className="space-y-1">
          <Label htmlFor="amountBase">{t('expense.amountBase', { currency: defaultCurrency })}</Label>
          <Input
            id="amountBase"
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            required
            value={amountBase}
            onChange={(e) => setAmountBase(e.target.value)}
          />
        </div>
      ) : null}
      <div className="space-y-1">
        <Label htmlFor="category">{t('expense.category')}</Label>
        <select
          id="category"
          className={selectClass}
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
        >
          {CATEGORIES.map((key) => (
            <option key={key} value={key}>
              {t(`categories.${key}`)}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="date">{t('expense.date')}</Label>
        <Input
          id="date"
          type="date"
          required
          value={occurredOn}
          onChange={(e) => setOccurredOn(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="note">
          {t('expense.note')}{' '}
          <span className="font-normal text-neutral-400">({t('expense.noteOptional')})</span>
        </Label>
        <Input id="note" type="text" value={note} onChange={(e) => setNote(e.target.value)} />
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
