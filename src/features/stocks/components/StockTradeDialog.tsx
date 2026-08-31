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
import type { Account } from '@/features/accounts/hooks/useAccounts'
import type { StockHolding } from '@/features/stocks/hooks/useStockHoldings'
import {
  convertQuoteAmount,
  fetchStockQuote,
  normalizeSymbol,
  type StockQuote,
} from '@/features/stocks/lib/quote'
import { MoneyText } from '@/shared/ui/HideMoney'

const selectClass =
  'flex h-11 w-full rounded-xl border border-gold-soft bg-surface px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-gold'

export type StockTradeSide = 'buy' | 'sell'

interface StockTradeDialogProps {
  open: boolean
  side: StockTradeSide
  holdings: StockHolding[]
  accounts: Account[]
  lang: string
  targetHoldingId?: string | null
  onOpenChange: (open: boolean) => void
  onSubmit: (input: {
    side: StockTradeSide
    symbol: string
    holdingId?: string
    shares: number
    price?: number
    quote: StockQuote
    accountId: string
    moneyAmount: number
  }) => Promise<void>
}

export function StockTradeDialog({
  open,
  side,
  holdings,
  accounts,
  lang,
  targetHoldingId,
  onOpenChange,
  onSubmit,
}: StockTradeDialogProps) {
  const { t } = useTranslation()
  const [holdingId, setHoldingId] = useState('')
  const [symbol, setSymbol] = useState('')
  const [accountId, setAccountId] = useState('')
  const [shares, setShares] = useState('')
  const [buyPrice, setBuyPrice] = useState('')
  const [quote, setQuote] = useState<StockQuote | null>(null)
  const [receive, setReceive] = useState<number | null>(null)
  const [converting, setConverting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const holding = holdings.find((item) => item.id === holdingId) ?? null
  const account = accounts.find((item) => item.id === accountId) ?? null
  const activeSymbol = side === 'sell' ? holding?.symbol ?? '' : normalizeSymbol(symbol)

  useEffect(() => {
    if (!open) return
    setShares('')
    setBuyPrice('')
    setQuote(null)
    setReceive(null)
    setError(null)
    const target = targetHoldingId
      ? holdings.find((item) => item.id === targetHoldingId)
      : holdings[0]
    if (target) setHoldingId(target.id)
    if (accounts[0]) setAccountId(accounts[0].id)
    setSymbol(side === 'buy' ? (target?.symbol ?? '') : '')
  }, [open, side, holdings, accounts, targetHoldingId])

  useEffect(() => {
    if (!open || !activeSymbol) {
      setQuote(null)
      return
    }
    let cancelled = false
    void fetchStockQuote(activeSymbol)
      .then((next) => {
        if (!cancelled) {
          setQuote(next)
          if (side === 'buy') {
            setBuyPrice(String(next.price))
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQuote(null)
          setError(t('stocks.quoteUnavailable'))
        }
      })
    return () => {
      cancelled = true
    }
  }, [open, activeSymbol, side, t])

  useEffect(() => {
    const sharesValue = Number(shares)
    const effectivePrice = side === 'buy' ? Number(buyPrice) : (quote?.price ?? 0)

    if (
      !open ||
      !quote ||
      !account ||
      !Number.isFinite(sharesValue) ||
      sharesValue <= 0 ||
      !Number.isFinite(effectivePrice) ||
      effectivePrice <= 0
    ) {
      setReceive(null)
      return
    }
    let cancelled = false
    setConverting(true)
    void convertQuoteAmount(effectivePrice * sharesValue, quote.currency, account.currency)
      .then((amount) => {
        if (!cancelled) setReceive(amount)
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
  }, [open, quote, account, shares, buyPrice, side])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const sharesValue = Number(shares)
    const effectivePrice = side === 'buy' ? Number(buyPrice) : (quote?.price ?? 0)

    if (
      !quote ||
      !account ||
      receive == null ||
      !Number.isFinite(sharesValue) ||
      sharesValue <= 0 ||
      !Number.isFinite(effectivePrice) ||
      effectivePrice <= 0
    ) {
      setError(t('expense.error'))
      return
    }
    if (side === 'sell') {
      if (!holding || sharesValue > holding.shares) {
        setError(t('stocks.insufficientShares'))
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
        symbol: quote.symbol,
        holdingId: holding?.id,
        shares: sharesValue,
        price: side === 'buy' ? effectivePrice : undefined,
        quote,
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
          <DialogTitle>{side === 'buy' ? t('stocks.buy') : t('stocks.sell')}</DialogTitle>
          <DialogDescription>{t('stocks.tradeHint')}</DialogDescription>
        </DialogHeader>
        {accounts.length === 0 ? (
          <p className="text-sm text-neutral-600">{t('accounts.needAccountFirst')}</p>
        ) : side === 'sell' && holdings.length === 0 ? (
          <p className="text-sm text-neutral-600">{t('stocks.empty')}</p>
        ) : (
          <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
            {side === 'sell' ? (
              <div className="space-y-1">
                <Label htmlFor="stock-holding">{t('stocks.fromHolding')}</Label>
                <select
                  id="stock-holding"
                  className={selectClass}
                  value={holdingId}
                  onChange={(e) => setHoldingId(e.target.value)}
                >
                  {holdings.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.symbol} · {item.shares}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-1">
                <Label htmlFor="stock-buy-symbol">{t('stocks.symbol')}</Label>
                <Input
                  id="stock-buy-symbol"
                  required
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  placeholder={t('stocks.symbolPlaceholder')}
                />
                <p className="text-xs text-neutral-500">{t('stocks.egyptHint')}</p>
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="stock-trade-shares">{t('stocks.shares')}</Label>
              <Input
                id="stock-trade-shares"
                type="number"
                min="0.000001"
                step="any"
                max={side === 'sell' ? holding?.shares : undefined}
                inputMode="decimal"
                required
                value={shares}
                onChange={(e) => setShares(e.target.value)}
              />
            </div>
            {side === 'buy' && quote ? (
              <div className="space-y-1">
                <Label htmlFor="stock-buy-price">
                  {t('stocks.pricePerShare')} ({quote.currency})
                </Label>
                <Input
                  id="stock-buy-price"
                  type="number"
                  min="0.0001"
                  step="any"
                  inputMode="decimal"
                  required
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                />
              </div>
            ) : null}
            <div className="space-y-1">
              <Label htmlFor="stock-trade-account">
                {side === 'buy' ? t('stocks.fromAccount') : t('stocks.toAccount')}
              </Label>
              <select
                id="stock-trade-account"
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
            {quote ? (
              <p className="text-sm text-neutral-600">
                {quote.name} · <MoneyText amount={quote.price} lang={lang} currency={quote.currency} /> (
                {t(quote.source === 'EGX' ? 'stocks.sourceEgx' : 'stocks.sourceYahoo')})
              </p>
            ) : null}
            {converting ? <p className="text-sm text-neutral-500">{t('accounts.converting')}</p> : null}
            {receive != null && account ? (
              <p className="text-sm font-medium">
                {side === 'buy' ? t('stocks.payAmount') : t('accounts.receiveAmount')}:{' '}
                <MoneyText amount={receive} lang={lang} currency={account.currency} />
              </p>
            ) : null}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={saving || converting || receive == null || !quote}
                className="min-h-11 flex-1 rounded-xl"
              >
                {side === 'buy' ? t('stocks.buy') : t('stocks.sell')}
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
