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
import { KARATS, type Karat, type KaratPrices } from '@/features/gold/lib/gold'
import type { CurrencyCode } from '@/shared/lib/currencies'
import { formatAmount } from '@/shared/lib/format'
import { MoneyText } from '@/shared/ui/HideMoney'

const selectClass =
  'flex h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-neutral-400'

export type GoldTradeSide = 'buy' | 'sell'

interface GoldTradeDialogProps {
  open: boolean
  side: GoldTradeSide
  holdings: GoldHolding[]
  accounts: Account[]
  prices: KaratPrices | null
  defaultCurrency: CurrencyCode
  lang: string
  targetHoldingId?: string | null
  onOpenChange: (open: boolean) => void
  onSubmit: (input: {
    side: GoldTradeSide
    holdingId?: string
    karat: Karat
    grams: number
    accountId: string
    moneyAmount: number
  }) => Promise<void>
}

export function GoldTradeDialog({
  open,
  side,
  holdings,
  accounts,
  prices,
  defaultCurrency,
  lang,
  targetHoldingId,
  onOpenChange,
  onSubmit,
}: GoldTradeDialogProps) {
  const { t } = useTranslation()
  const [holdingId, setHoldingId] = useState('')
  const [karat, setKarat] = useState<Karat>(24)
  const [accountId, setAccountId] = useState('')
  const [grams, setGrams] = useState('')
  const [receive, setReceive] = useState<number | null>(null)
  const [converting, setConverting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const holding = holdings.find((item) => item.id === holdingId) ?? null
  const account = accounts.find((item) => item.id === accountId) ?? null
  const activeKarat = side === 'sell' ? holding?.karat ?? karat : karat

  const valueInBase = useMemo(() => {
    if (!prices) return null
    const gramsValue = Number(grams)
    if (!Number.isFinite(gramsValue) || gramsValue <= 0) return null
    return estimateGoldValue(gramsValue, activeKarat, prices)
  }, [grams, activeKarat, prices])

  useEffect(() => {
    if (!open) return
    setGrams('')
    setReceive(null)
    setError(null)
    const target = targetHoldingId
      ? holdings.find((item) => item.id === targetHoldingId)
      : holdings[0]
    if (target) {
      setHoldingId(target.id)
      setKarat(target.karat)
    } else {
      setHoldingId('')
      setKarat(24)
    }
    if (accounts[0]) setAccountId(accounts[0].id)
  }, [open, side, holdings, accounts, targetHoldingId])

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
    const gramsValue = Number(grams)
    if (!account || valueInBase == null || receive == null || !Number.isFinite(gramsValue) || gramsValue <= 0) {
      setError(t('expense.error'))
      return
    }
    if (side === 'sell') {
      if (!holding || gramsValue > holding.grams) {
        setError(t('gold.insufficient'))
        return
      }
    }
    if (side === 'buy' && account.balance < receive) {
      setError(t('accounts.insufficient'))
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSubmit({
        side,
        holdingId: holding?.id,
        karat: activeKarat,
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
          <DialogTitle>{side === 'buy' ? t('gold.buy') : t('gold.sell')}</DialogTitle>
          <DialogDescription>{side === 'buy' ? t('gold.buyHint') : t('gold.transferHint')}</DialogDescription>
        </DialogHeader>
        {!prices ? (
          <p className="text-sm text-amber-700">{t('gold.setPricesFirst')}</p>
        ) : accounts.length === 0 ? (
          <p className="text-sm text-neutral-600">{t('accounts.needAccountFirst')}</p>
        ) : side === 'sell' && holdings.length === 0 ? (
          <p className="text-sm text-neutral-600">{t('gold.empty')}</p>
        ) : (
          <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
            {side === 'sell' ? (
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
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-1">
                <Label htmlFor="gold-buy-karat">{t('gold.karat')}</Label>
                <select
                  id="gold-buy-karat"
                  className={selectClass}
                  value={karat}
                  onChange={(e) => setKarat(Number(e.target.value) as Karat)}
                >
                  {KARATS.map((k) => (
                    <option key={k} value={k}>
                      {k}K
                      {prices ? ` · ${formatAmount(prices[k], lang, defaultCurrency)}/${t('gold.grams')}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="gold-trade-grams">{t('gold.grams')}</Label>
              <Input
                id="gold-trade-grams"
                type="number"
                min="0.001"
                step="0.001"
                max={side === 'sell' ? holding?.grams : undefined}
                inputMode="decimal"
                required
                value={grams}
                onChange={(e) => setGrams(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="gold-trade-account">
                {side === 'buy' ? t('gold.fromAccount') : t('gold.toAccount')}
              </Label>
              <select
                id="gold-trade-account"
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
                {t('gold.valueInBase')}: <MoneyText amount={valueInBase} lang={lang} currency={defaultCurrency} />
              </p>
            ) : null}
            {converting ? <p className="text-sm text-neutral-500">{t('accounts.converting')}</p> : null}
            {receive != null && account ? (
              <p className="text-sm font-medium">
                {side === 'buy' ? t('gold.payAmount') : t('accounts.receiveAmount')}:{' '}
                <MoneyText amount={receive} lang={lang} currency={account.currency} />
              </p>
            ) : null}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <div className="flex gap-2">
              <Button type="submit" disabled={saving || converting || receive == null} className="min-h-11 flex-1 rounded-xl">
                {side === 'buy' ? t('gold.buy') : t('gold.sell')}
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
