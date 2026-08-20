import { Trash2, TrendingDown, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import type { StockHolding } from '@/features/stocks/hooks/useStockHoldings'
import type { StockQuote } from '@/features/stocks/lib/quote'
import { MoneyText } from '@/shared/ui/HideMoney'

function pnlClass(value: number) {
  if (value > 0.004) return 'text-emerald-600'
  if (value < -0.004) return 'text-red-600'
  return 'text-neutral-800'
}

interface StockHoldingRowProps {
  item: StockHolding
  quote: StockQuote | undefined
  values: { market: number; cost: number } | undefined
  weight: number | null
  lang: string
  defaultCurrency: string
  canTrade: boolean
  onBuy: () => void
  onSell: () => void
  onDelete: () => void
}

export function StockHoldingRow({
  item,
  quote,
  values,
  weight,
  lang,
  defaultCurrency,
  canTrade,
  onBuy,
  onSell,
  onDelete,
}: StockHoldingRowProps) {
  const { t } = useTranslation()
  const live = quote ? quote.price * item.shares : null
  const pnl = values ? values.market - values.cost : null
  const winRatio = values && values.cost > 0 ? ((values.market - values.cost) / values.cost) * 100 : null

  return (
    <li className="space-y-3 rounded-2xl border border-stock/20 bg-surface p-4 shadow-[0_12px_28px_rgba(27,122,82,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">
            {item.symbol}
            {quote?.name ? <span className="font-normal text-muted"> · {quote.name}</span> : null}
          </p>
          <p className="text-sm text-muted">
            {item.shares} × <MoneyText amount={item.avg_cost} lang={lang} currency={item.quote_currency} />
          </p>
          <p className="text-sm text-muted">
            {quote ? (
              <>
                {t('stocks.live')}: <MoneyText amount={quote.price} lang={lang} currency={quote.currency} />
              </>
            ) : (
              t('stocks.quoteUnavailable')
            )}
            {live != null ? (
              <>
                {' · '}
                <MoneyText amount={live} lang={lang} currency={quote?.currency ?? item.quote_currency} />
              </>
            ) : null}
          </p>
        </div>
        <div className="flex items-start gap-1">
          {winRatio != null ? (
            <p className={`pt-1 text-lg font-bold ${pnlClass(winRatio)}`}>
              {winRatio >= 0 ? '+' : ''}
              {winRatio.toFixed(1)}%
            </p>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10 shrink-0 text-red-700"
            aria-label={t('app.delete')}
            onClick={onDelete}
          >
            <Trash2 />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-stock-soft/50 p-2">
          <p className="text-xs text-muted">{t('stocks.weight')}</p>
          <p className="font-semibold">{weight == null ? '—' : `${weight.toFixed(1)}%`}</p>
        </div>
        <div className="rounded-xl bg-stock-soft/50 p-2">
          <p className="text-xs text-muted">{t('stocks.totalValue')}</p>
          <p className={`text-sm font-semibold ${pnl == null ? '' : pnlClass(pnl)}`}>
            {values ? <MoneyText amount={values.market} lang={lang} currency={defaultCurrency} /> : '—'}
          </p>
        </div>
        <div className="rounded-xl bg-stock-soft/50 p-2">
          <p className="text-xs text-muted">{t('stocks.unrealized')}</p>
          <p className={`text-sm font-semibold ${pnl == null ? '' : pnlClass(pnl)}`}>
            {pnl == null ? (
              '—'
            ) : (
              <MoneyText
                amount={pnl}
                lang={lang}
                currency={defaultCurrency}
                prefix={pnl >= 0 ? '+' : ''}
              />
            )}
          </p>
        </div>
      </div>
      {weight != null ? (
        <div className="h-1.5 overflow-hidden rounded-full bg-stock-soft">
          <div
            className={`h-full rounded-full ${pnl != null && pnl < 0 ? 'bg-red-600' : 'bg-stock'}`}
            style={{ width: `${Math.min(weight, 100)}%` }}
          />
        </div>
      ) : null}
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="min-h-10 flex-1 rounded-xl" disabled={!canTrade} onClick={onBuy}>
          <TrendingUp />
          {t('stocks.buy')}
        </Button>
        <Button type="button" variant="outline" className="min-h-10 flex-1 rounded-xl" disabled={!canTrade} onClick={onSell}>
          <TrendingDown />
          {t('stocks.sell')}
        </Button>
      </div>
    </li>
  )
}
