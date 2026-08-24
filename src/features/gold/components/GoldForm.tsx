import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { GoldHoldingInput } from '@/features/gold/hooks/useGoldHoldings'
import { KARATS, type Karat } from '@/features/gold/lib/gold'

const selectClass =
  'flex h-11 w-full rounded-xl border border-gold-soft bg-surface px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-gold'

interface GoldFormProps {
  onSubmit: (values: GoldHoldingInput) => Promise<void>
  onCancel: () => void
}

export function GoldForm({ onSubmit, onCancel }: GoldFormProps) {
  const { t } = useTranslation()
  const [grams, setGrams] = useState('')
  const [karat, setKarat] = useState<Karat>(24)
  const [avgCost, setAvgCost] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const gramsValue = Number(grams)
    const avgCostValue = Number(avgCost)
    if (!Number.isFinite(gramsValue) || gramsValue <= 0) {
      setError(t('expense.error'))
      return
    }
    if (!Number.isFinite(avgCostValue) || avgCostValue < 0) {
      setError(t('expense.error'))
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSubmit({ grams: gramsValue, karat, avgCost: avgCostValue, note })
    } catch {
      setError(t('expense.error'))
      setSaving(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
      <div className="space-y-1">
        <Label htmlFor="gold-grams">{t('gold.grams')}</Label>
        <Input
          id="gold-grams"
          type="number"
          min="0.001"
          step="0.001"
          inputMode="decimal"
          required
          className="font-nums"
          value={grams}
          onChange={(e) => setGrams(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="gold-karat">{t('gold.karat')}</Label>
        <select
          id="gold-karat"
          className={selectClass}
          value={karat}
          onChange={(e) => setKarat(Number(e.target.value) as Karat)}
        >
          {KARATS.map((k) => (
            <option key={k} value={k}>
              {k}K
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="gold-avg-cost">{t('gold.avgCost')}</Label>
        <p className="text-xs text-muted">{t('gold.avgCostHint')}</p>
        <Input
          id="gold-avg-cost"
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          required
          className="font-nums"
          value={avgCost}
          onChange={(e) => setAvgCost(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="gold-note">
          {t('expense.note')}{' '}
          <span className="font-normal text-neutral-400">({t('expense.noteOptional')})</span>
        </Label>
        <Input id="gold-note" value={note} onChange={(e) => setNote(e.target.value)} />
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
