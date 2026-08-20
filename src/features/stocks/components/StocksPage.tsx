import { Plus, RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useAccounts } from '@/features/accounts'
import { useProfile } from '@/features/settings'
import { StockFormDialog } from '@/features/stocks/components/StockFormDialog'
import { StockHoldingRow } from '@/features/stocks/components/StockHoldingRow'
import { StockTradeDialog, type StockTradeSide } from '@/features/stocks/components/StockTradeDialog'
import { useStockHoldings } from '@/features/stocks/hooks/useStockHoldings'
import { useStockQuotes } from '@/features/stocks/hooks/useStockQuotes'
import { convertQuoteAmount, sameTicker } from '@/features/stocks/lib/quote'
import { isSupabaseConfigured } from '@/shared/lib/supabase'
import { formatAmount } from '@/shared/lib/format'
import { SetupNotice } from '@/shared/ui/SetupNotice'

function pnlClass(value: number) {
  if (value > 0.004) return 'text-emerald-600'
  if (value < -0.004) return 'text-red-600'
  return 'text-neutral-800'
}

export function StocksPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const { profile } = useProfile()
  const { accounts, addMoney, spendMoney } = useAccounts()
  const { holdings, loading, error, upsertHolding, reduceShares, deleteHolding } = useStockHoldings()
  const symbols = useMemo(() => holdings.map((item) => item.symbol), [holdings])
  const { quotes, loading: quotesLoading, error: quotesError, refresh } = useStockQuotes(symbols)
  const defaultCurrency = profile?.default_currency ?? 'USD'

  function quoteFor(symbol: string) {
    return quotes[symbol] ?? Object.values(quotes).find((q) => sameTicker(q.symbol, symbol))
  }

  const [addOpen, setAddOpen] = useState(false)
  const [trade, setTrade] = useState<{ side: StockTradeSide; holdingId?: string } | null>(null)
  const [converted, setConverted] = useState<Record<string, { market: number; cost: number }>>({})

  const totalMarket = useMemo(
    () => Object.values(converted).reduce((sum, item) => sum + item.market, 0),
    [converted],
  )
  const totalCost = useMemo(
    () => Object.values(converted).reduce((sum, item) => sum + item.cost, 0),
    [converted],
  )
  const totalPnl = totalMarket - totalCost
  const totalWinRatio = totalCost > 0 ? (totalPnl / totalCost) * 100 : null

  const sortedHoldings = useMemo(() => {
    return [...holdings].sort((a, b) => {
      const aVal = converted[a.id]
      const bVal = converted[b.id]
      const aRatio = aVal && aVal.cost > 0 ? (aVal.market - aVal.cost) / aVal.cost : Number.NEGATIVE_INFINITY
      const bRatio = bVal && bVal.cost > 0 ? (bVal.market - bVal.cost) / bVal.cost : Number.NEGATIVE_INFINITY
      return bRatio - aRatio
    })
  }, [holdings, converted])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const next: Record<string, { market: number; cost: number }> = {}
      await Promise.all(
        holdings.map(async (item) => {
          const quote = quoteFor(item.symbol)
          const marketRaw = quote ? quote.price * item.shares : null
          const costRaw = item.avg_cost * item.shares
          const from = quote?.currency ?? item.quote_currency
          try {
            const [market, cost] = await Promise.all([
              marketRaw == null ? Promise.resolve(null) : convertQuoteAmount(marketRaw, from, defaultCurrency),
              convertQuoteAmount(costRaw, item.quote_currency, defaultCurrency),
            ])
            if (market != null) next[item.id] = { market, cost }
          } catch {
            /* skip row totals */
          }
        }),
      )
      if (!cancelled) setConverted(next)
    })()
    return () => {
      cancelled = true
    }
  }, [holdings, quotes, defaultCurrency])

  return (
    <div className="space-y-6">
      {!isSupabaseConfigured ? <SetupNotice /> : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t('app.navStocks')}</h1>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="rounded-xl" disabled={quotesLoading} onClick={() => void refresh()}>
            <RefreshCw className={quotesLoading ? 'animate-spin' : undefined} />
            {t('stocks.refresh')}
          </Button>
          <Button type="button" className="rounded-xl" onClick={() => setAddOpen(true)}>
            <Plus />
            {t('stocks.add')}
          </Button>
        </div>
      </div>
      {loading ? <p>{t('app.loading')}</p> : null}
      {error ? <p className="text-red-600">{t('expense.error')}</p> : null}
      {quotesError ? <p className="text-sm text-amber-700">{t('stocks.quoteUnavailable')}</p> : null}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-sm text-neutral-500">{t('stocks.totalValue')}</p>
          <p className="text-xl font-semibold text-neutral-900">
            {formatAmount(totalMarket, lang, defaultCurrency)}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-sm text-neutral-500">{t('stocks.unrealized')}</p>
          <p className={`text-xl font-semibold ${pnlClass(totalPnl)}`}>
            {formatAmount(totalPnl, lang, defaultCurrency)}
            {totalWinRatio == null ? '' : ` (${totalWinRatio >= 0 ? '+' : ''}${totalWinRatio.toFixed(1)}%)`}
          </p>
        </div>
      </div>
      <ul className="space-y-2">
        {sortedHoldings.map((item) => {
          const values = converted[item.id]
          const weight = values && totalMarket > 0 ? (values.market / totalMarket) * 100 : null
          return (
            <StockHoldingRow
              key={item.id}
              item={item}
              quote={quoteFor(item.symbol)}
              values={values}
              weight={weight}
              lang={lang}
              defaultCurrency={defaultCurrency}
              canTrade={accounts.length > 0}
              onBuy={() => setTrade({ side: 'buy', holdingId: item.id })}
              onSell={() => setTrade({ side: 'sell', holdingId: item.id })}
              onDelete={() => {
                if (window.confirm(t('stocks.confirmDelete'))) void deleteHolding(item.id)
              }}
            />
          )
        })}
      </ul>
      {!loading && holdings.length === 0 ? (
        <p className="text-sm text-neutral-500">{t('stocks.empty')}</p>
      ) : null}
      <StockFormDialog open={addOpen} lang={lang} onOpenChange={setAddOpen} onSubmit={upsertHolding} />
      <StockTradeDialog
        open={trade != null}
        side={trade?.side ?? 'buy'}
        targetHoldingId={trade?.holdingId}
        holdings={holdings}
        accounts={accounts}
        lang={lang}
        onOpenChange={(open) => {
          if (!open) setTrade(null)
        }}
        onSubmit={async ({ side, symbol, holdingId, shares, quote, accountId, moneyAmount }) => {
          if (side === 'buy') {
            await spendMoney(accountId, moneyAmount)
            await upsertHolding({
              symbol,
              shares,
              avgCost: quote.price,
              quoteCurrency: quote.currency,
            })
          } else {
            if (!holdingId) throw new Error('Holding required')
            await addMoney(accountId, moneyAmount)
            await reduceShares(holdingId, shares)
          }
        }}
      />
    </div>
  )
}
