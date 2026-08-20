import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { CATEGORIES, type Category } from '../lib/categories'
import type { Expense, ExpenseInput } from '../hooks/useExpenses'

interface ExpenseFormProps {
  initial?: Expense | null
  onSubmit: (input: ExpenseInput) => Promise<void>
  onCancel: () => void
}

export function ExpenseForm({ initial, onSubmit, onCancel }: ExpenseFormProps) {
  const { t } = useTranslation()
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [category, setCategory] = useState<Category>(initial?.category ?? 'food')
  const [occurredOn, setOccurredOn] = useState(
    initial?.occurred_on ?? new Date().toISOString().slice(0, 10),
  )
  const [note, setNote] = useState(initial?.note ?? '')
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
      await onSubmit({
        amount: value,
        category,
        occurred_on: occurredOn,
        note,
      })
    } catch {
      setError(t('expense.error'))
      setSaving(false)
    }
  }

  const field = 'mt-1 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base'
  const label = 'block text-sm font-medium text-slate-700'

  return (
    <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
      <div>
        <label className={label} htmlFor="amount">
          {t('expense.amount')}
        </label>
        <input
          id="amount"
          className={field}
          type="number"
          min="0.01"
          step="0.01"
          inputMode="decimal"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div>
        <label className={label} htmlFor="category">
          {t('expense.category')}
        </label>
        <select
          id="category"
          className={field}
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
      <div>
        <label className={label} htmlFor="date">
          {t('expense.date')}
        </label>
        <input
          id="date"
          className={field}
          type="date"
          required
          value={occurredOn}
          onChange={(e) => setOccurredOn(e.target.value)}
        />
      </div>
      <div>
        <label className={label} htmlFor="note">
          {t('expense.note')}{' '}
          <span className="font-normal text-slate-400">({t('expense.noteOptional')})</span>
        </label>
        <input
          id="note"
          className={field}
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="min-h-12 flex-1 rounded-xl bg-slate-900 px-4 text-base font-semibold text-white disabled:opacity-60"
        >
          {t('app.save')}
        </button>
        <button
          type="button"
          className="min-h-12 rounded-xl px-4 text-base font-medium text-slate-700 hover:bg-slate-100"
          onClick={onCancel}
        >
          {t('app.cancel')}
        </button>
      </div>
    </form>
  )
}
