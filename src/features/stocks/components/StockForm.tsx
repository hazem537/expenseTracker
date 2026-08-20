import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { StockHoldingInput } from '@/features/stocks/hooks/useStockHoldings'
import { fetchStockQuote, normalizeSymbol } from '@/features/stocks/lib/quote'
import { formatAmount } from '@/shared/lib/format'

interface StockFormProps {
  lang: string
  onSubmit: (values: StockHoldingInput) => Promise<void>
  onCancel: () => void
}

export function StockForm({ lang, onSubmit, onCancel }: StockFormProps) {
  const { t } = useTranslation()
  const [symbol, setSymbol] = useState('')
  const [shares, setShares] = useState('')
  const [avgCost, setAvgCost] = useState('')
  const [quoteLabel, setQuoteLabel] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const code = normalizeSymbol(symbol)
    if (code.length < 1) {
      setQuoteLabel(null)
      return
    }
    let cancelled = false
    const timer = window.setTimeout(() => {
      void fetchStockQuote(code)
        .then((quote) => {
          if (cancelled) return
          setQuoteLabel(
            `${quote.symbol} · ${quote.name} · ${formatAmount(quote.price, lang, quote.currency)} (${t(quote.source === 'EGX' ? 'stocks.sourceEgx' : 'stocks.sourceYahoo')})`,
          )
          setError(null)
        })
        .catch(() => {
          if (!cancelled) {
            setQuoteLabel(null)
            setError(t('stocks.quoteUnavailable'))
          }
        })
    }, 400)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [symbol, lang, t])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const sharesValue = Number(shares)
    const avgValue = Number(avgCost)
    const code = normalizeSymbol(symbol)
    if (!code || !Number.isFinite(sharesValue) || sharesValue <= 0 || !Number.isFinite(avgValue) || avgValue < 0) {
      setError(t('expense.error'))
      return
    }
    setSaving(true)
    setError(null)
    try {
      const quote = await fetchStockQuote(code)
      await onSubmit({
        symbol: quote.symbol,
        shares: sharesValue,
        avgCost: avgValue,
        quoteCurrency: quote.currency,
      })
    } catch {
      setError(t('stocks.quoteUnavailable'))
      setSaving(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
      <div className="space-y-1">
        <Label htmlFor="stock-symbol">{t('stocks.symbol')}</Label>
        <Input
          id="stock-symbol"
          required
          autoCapitalize="characters"
          placeholder={t('stocks.symbolPlaceholder')}
          value={symbol}
          onChange={(e) => {
            setSymbol(e.target.value)
            setError(null)
          }}
        />
        <p className="text-xs text-neutral-500">{t('stocks.egyptHint')}</p>
        {quoteLabel ? <p className="text-sm text-neutral-500">{quoteLabel}</p> : null}
      </div>
      <div className="space-y-1">
        <Label htmlFor="stock-shares">{t('stocks.shares')}</Label>
        <Input
          id="stock-shares"
          type="number"
          min="0.000001"
          step="any"
          inputMode="decimal"
          required
          value={shares}
          onChange={(e) => setShares(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="stock-avg">{t('stocks.avgCost')}</Label>
        <Input
          id="stock-avg"
          type="number"
          min="0"
          step="any"
          inputMode="decimal"
          required
          value={avgCost}
          onChange={(e) => setAvgCost(e.target.value)}
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
