import { useEffect, useMemo, useState, type FormEvent } from 'react'
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
import type { Account } from '@/features/accounts/hooks/useAccounts'
import { convertAmount, fetchExchangeRate } from '@/features/accounts/lib/exchangeRate'
import { estimateGoldValue, type GoldHolding } from '@/features/gold/hooks/useGoldHoldings'
import type { KaratPrices } from '@/features/gold/lib/gold'
import type { CurrencyCode } from '@/shared/lib/currencies'
import { formatAmount } from '@/shared/lib/format'

const selectClass =
  'flex h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-neutral-400'

interface GoldToAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  holdings: GoldHolding[]
  accounts: Account[]
  prices: KaratPrices | null
  defaultCurrency: CurrencyCode
  lang: string
  onSubmit: (input: { holdingId: string; grams: number; accountId: string; moneyAmount: number }) => Promise<void>
}

export function GoldToAccountDialog({
  open,
  onOpenChange,
  holdings,
  accounts,
  prices,
  defaultCurrency,
  lang,
  onSubmit,
}: GoldToAccountDialogProps) {
  const { t } = useTranslation()
  const [holdingId, setHoldingId] = useState('')
  const [accountId, setAccountId] = useState('')
  const [grams, setGrams] = useState('')
  const [receive, setReceive] = useState<number | null>(null)
  const [converting, setConverting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const holding = holdings.find((item) => item.id === holdingId) ?? null
  const account = accounts.find((item) => item.id === accountId) ?? null

  const valueInBase = useMemo(() => {
    if (!holding || !prices) return null
    const gramsValue = Number(grams)
    if (!Number.isFinite(gramsValue) || gramsValue <= 0) return null
    return estimateGoldValue(gramsValue, holding.karat, prices)
  }, [grams, holding, prices])

  useEffect(() => {
    if (open && holdings[0]) setHoldingId(holdings[0].id)
    if (open && accounts[0]) setAccountId(accounts[0].id)
    if (open) {
      setGrams('')
      setReceive(null)
      setError(null)
    }
  }, [open, holdings, accounts])

  useEffect(() => {
    if (!open || valueInBase == null || !account) {
      setReceive(null)
      return
    }
    let cancelled = false
    setConverting(true)
    void fetchExchangeRate(defaultCurrency, account.currency)
      .then((rate) => {
        if (!cancelled) setReceive(convertAmount(valueInBase, rate))
      })
      .catch(() => {
        if (!cancelled) setReceive(null)
      })
      .finally(() => {
        if (!cancelled) setConverting(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, valueInBase, account, defaultCurrency])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!holding || !account || valueInBase == null || receive == null) {
      setError(t('expense.error'))
      return
    }
    const gramsValue = Number(grams)
    if (gramsValue > holding.grams) {
      setError(t('gold.insufficient'))
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSubmit({
        holdingId: holding.id,
        grams: gramsValue,
        accountId: account.id,
        moneyAmount: receive,
      })
      onOpenChange(false)
    } catch {
      setError(t('expense.error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('gold.transferToAccount')}</DialogTitle>
          <DialogDescription>{t('gold.transferHint')}</DialogDescription>
        </DialogHeader>
        {!prices ? (
          <p className="text-sm text-amber-700">{t('gold.setPricesFirst')}</p>
        ) : accounts.length === 0 ? (
          <p className="text-sm text-neutral-600">{t('accounts.needAccountFirst')}</p>
        ) : holdings.length === 0 ? (
          <p className="text-sm text-neutral-600">{t('gold.empty')}</p>
        ) : (
          <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
            <div className="space-y-1">
              <Label htmlFor="gold-holding">{t('gold.fromHolding')}</Label>
              <select
                id="gold-holding"
                className={selectClass}
                value={holdingId}
                onChange={(e) => setHoldingId(e.target.value)}
              >
                {holdings.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.grams} g · {item.karat}K
                    {item.note ? ` · ${item.note}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="gold-sell-grams">{t('gold.grams')}</Label>
              <Input
                id="gold-sell-grams"
                type="number"
                min="0.001"
                step="0.001"
                max={holding?.grams}
                inputMode="decimal"
                required
                value={grams}
                onChange={(e) => setGrams(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="gold-to-account">{t('gold.toAccount')}</Label>
              <select
                id="gold-to-account"
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
            {valueInBase != null ? (
              <p className="text-sm text-neutral-600">
                {t('gold.valueInBase')}: {formatAmount(valueInBase, lang, defaultCurrency)}
              </p>
            ) : null}
            {converting ? <p className="text-sm text-neutral-500">{t('accounts.converting')}</p> : null}
            {receive != null && account ? (
              <p className="text-sm font-medium">
                {t('accounts.receiveAmount')}: {formatAmount(receive, lang, account.currency)}
              </p>
            ) : null}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <div className="flex gap-2">
              <Button type="submit" disabled={saving || converting || receive == null} className="min-h-11 flex-1 rounded-xl">
                {t('gold.transferToAccount')}
              </Button>
              <Button type="button" variant="secondary" className="min-h-11 rounded-xl" onClick={() => onOpenChange(false)}>
                {t('app.cancel')}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
