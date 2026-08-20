import { Trash2, TrendingDown, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { estimateGoldValue, type GoldHolding } from '@/features/gold/hooks/useGoldHoldings'
import type { KaratPrices } from '@/features/gold/lib/gold'
import { MoneyText } from '@/shared/ui/HideMoney'

interface GoldHoldingRowProps {
  item: GoldHolding
  prices: KaratPrices | null
  weight: number | null
  lang: string
  defaultCurrency: string
  canTrade: boolean
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
  onBuy,
  onSell,
  onDelete,
}: GoldHoldingRowProps) {
  const { t } = useTranslation()
  const value = estimateGoldValue(item.grams, item.karat, prices)

  return (
    <li className="space-y-3 rounded-2xl border border-gold-soft/80 bg-surface p-4 shadow-[0_12px_28px_rgba(201,162,39,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">
            {item.karat}K · {item.grams} g
          </p>
          {item.note ? <p className="text-sm text-muted">{item.note}</p> : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-10 text-red-700"
          aria-label={t('app.delete')}
          onClick={onDelete}
        >
          <Trash2 />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-xl bg-gold-soft/30 p-2">
          <p className="text-xs text-muted">{t('gold.weight')}</p>
          <p className="font-semibold">{weight == null ? '—' : `${weight.toFixed(1)}%`}</p>
        </div>
        <div className="rounded-xl bg-gold-soft/30 p-2">
          <p className="text-xs text-muted">{t('gold.totalMoney')}</p>
          <p className="text-sm font-semibold">
            {value == null ? '—' : <MoneyText amount={value} lang={lang} currency={defaultCurrency} />}
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
