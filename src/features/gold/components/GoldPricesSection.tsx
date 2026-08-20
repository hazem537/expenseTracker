import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { KARATS, type KaratPrices } from '@/features/gold/lib/gold'
import { pricesFromProfile, useProfile } from '@/features/settings'

export function GoldPricesSection() {
  const { t } = useTranslation()
  const { profile, saveGoldPrices, refreshGoldPricesFromApi } = useProfile()
  const [values, setValues] = useState({ 24: '', 21: '', 18: '' })
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchedDefault = useRef(false)

  useEffect(() => {
    if (!profile || pricesFromProfile(profile) || fetchedDefault.current) return
    fetchedDefault.current = true
    void refreshGoldPricesFromApi().catch(() => {
      fetchedDefault.current = false
    })
  }, [profile, refreshGoldPricesFromApi])

  useEffect(() => {
    const prices = pricesFromProfile(profile)
    if (!prices) return
    setValues({
      24: String(prices[24]),
      21: String(prices[21]),
      18: String(prices[18]),
    })
  }, [profile])

  function parsePrices(): KaratPrices | null {
    const next = {} as KaratPrices
    for (const karat of KARATS) {
      const n = Number(values[karat])
      if (!Number.isFinite(n) || n <= 0) return null
      next[karat] = Math.round(n * 10000) / 10000
    }
    return next
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault()
    const prices = parsePrices()
    if (!prices) {
      setError(t('expense.error'))
      return
    }
    setBusy(true)
    setSaved(false)
    setError(null)
    try {
      await saveGoldPrices(prices)
      setSaved(true)
    } catch {
      setError(t('expense.error'))
    } finally {
      setBusy(false)
    }
  }

  async function handleRefresh() {
    setRefreshing(true)
    setSaved(false)
    setError(null)
    try {
      const prices = await refreshGoldPricesFromApi()
      setValues({
        24: String(prices[24]),
        21: String(prices[21]),
        18: String(prices[18]),
      })
      setSaved(true)
    } catch {
      setError(t('gold.priceUnavailable'))
    } finally {
      setRefreshing(false)
    }
  }

  if (!profile) return null

  return (
    <form className="space-y-4 rounded-2xl border border-gold-soft/70 bg-surface p-5 shadow-[0_12px_28px_rgba(201,162,39,0.08)]" onSubmit={(e) => void handleSave(e)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t('gold.pricesTitle')}</h2>
          <p className="text-sm text-muted">
            {t('gold.pricesHelp', { currency: profile.default_currency })}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          disabled={refreshing}
          onClick={() => void handleRefresh()}
        >
          <RefreshCw className={refreshing ? 'animate-spin' : undefined} />
          {t('gold.refreshPrices')}
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {KARATS.map((karat) => (
          <div key={karat} className="space-y-1">
            <Label htmlFor={`gold-price-${karat}`}>{t('gold.pricePerGram', { karat })}</Label>
            <Input
              id={`gold-price-${karat}`}
              type="number"
              min="0.0001"
              step="0.0001"
              inputMode="decimal"
              required
              value={values[karat]}
              onChange={(e) => setValues((prev) => ({ ...prev, [karat]: e.target.value }))}
            />
          </div>
        ))}
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {saved ? <p className="text-sm text-emerald-700">{t('settings.saved')}</p> : null}
      <Button type="submit" disabled={busy} className="min-h-12 w-full rounded-xl">
        {t('app.save')}
      </Button>
    </form>
  )
}
