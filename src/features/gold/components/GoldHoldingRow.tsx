import { Trash2, TrendingDown, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { estimateGoldValue, type GoldHolding } from '@/features/gold/hooks/useGoldHoldings'
import type { KaratPrices } from '@/features/gold/lib/gold'
import { MoneyText } from '@/shared/ui/HideMoney'

function pnlClass(value: number) {
  if (value > 0.004) return 'text-emerald-600'
  if (value < -0.004) return 'text-red-600'
  return 'text-neutral-800'
}

interface GoldHoldingRowProps {
  item: GoldHolding
  prices: KaratPrices | null
  weight: number | null
  lang: string
  defaultCurrency: string
  canTrade: boolean
  canDelete?: boolean
  onBuy: () => void
  onSell: () => void
  onDelete: () => void
}

export function GoldHoldingRow({
  item,
  prices,
  weight,
  lang,
  defaultCurrency,
  canTrade,
  canDelete = true,
  onBuy,
  onSell,
  onDelete,
}: GoldHoldingRowProps) {
  const { t } = useTranslation()
  const value = estimateGoldValue(item.grams, item.karat, prices)
  const cost = item.avg_cost * item.grams
  const livePerGram = prices ? prices[item.karat] : null
  const pnl = value != null && item.avg_cost > 0 ? value - cost : null
  const winRatio = pnl != null && cost > 0 ? (pnl / cost) * 100 : null

  return (
    <li className="space-y-3 rounded-2xl border border-gold-soft/80 bg-surface p-4 shadow-[0_12px_28px_rgba(201,162,39,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">
            {item.karat}K · <span className="font-nums">{item.grams}</span> g
          </p>
          {item.avg_cost > 0 ? (
            <p className="text-sm text-muted">
              {t('gold.avgCost')}: <MoneyText amount={item.avg_cost} lang={lang} currency={defaultCurrency} />
            </p>
          ) : null}
          {livePerGram != null ? (
            <p className="text-sm text-muted">
              {t('gold.live')}: <MoneyText amount={livePerGram} lang={lang} currency={defaultCurrency} />
            </p>
          ) : null}
          {item.note ? <p className="text-sm text-muted">{item.note}</p> : null}
        </div>
        <div className="flex items-start gap-1">
          {winRatio != null ? (
            <p className={`pt-1 text-lg font-bold font-nums ${pnlClass(winRatio)}`}>
              {winRatio >= 0 ? '+' : ''}
              {winRatio.toFixed(1)}%
            </p>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10 text-red-700"
            aria-label={t('app.delete')}
            disabled={!canDelete}
            onClick={onDelete}
          >
            <Trash2 />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-xl bg-gold-soft/30 p-2">
          <p className="text-xs text-muted">{t('gold.weight')}</p>
          <p className="font-semibold font-nums">{weight == null ? '—' : `${weight.toFixed(1)}%`}</p>
        </div>
        <div className="rounded-xl bg-gold-soft/30 p-2">
          <p className="text-xs text-muted">{t('gold.unrealized')}</p>
          <p className={`text-sm font-semibold ${pnl == null ? '' : pnlClass(pnl)}`}>
            {pnl == null ? '—' : <MoneyText amount={pnl} lang={lang} currency={defaultCurrency} />}
          </p>
        </div>
      </div>
      {weight != null ? (
        <div className="h-1.5 overflow-hidden rounded-full bg-gold-soft/40">
          <div className="h-full rounded-full bg-gold" style={{ width: `${Math.min(weight, 100)}%` }} />
        </div>
      ) : null}
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="min-h-10 flex-1 rounded-xl" disabled={!canTrade} onClick={onBuy}>
          <TrendingUp />
          {t('gold.buy')}
        </Button>
        <Button type="button" variant="outline" className="min-h-10 flex-1 rounded-xl" disabled={!canTrade} onClick={onSell}>
          <TrendingDown />
          {t('gold.sell')}
        </Button>
      </div>
    </li>
  )
}
