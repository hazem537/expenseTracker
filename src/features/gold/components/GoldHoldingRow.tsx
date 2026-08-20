import { Trash2, TrendingDown, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { estimateGoldValue, type GoldHolding } from '@/features/gold/hooks/useGoldHoldings'
import type { KaratPrices } from '@/features/gold/lib/gold'
import { formatAmount } from '@/shared/lib/format'

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
    <li className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">
            {item.karat}K · {item.grams} g
          </p>
          {item.note ? <p className="text-sm text-neutral-500">{item.note}</p> : null}
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
        <div className="rounded-xl bg-neutral-50 p-2">
          <p className="text-xs text-neutral-500">{t('gold.weight')}</p>
          <p className="font-semibold">{weight == null ? '—' : `${weight.toFixed(1)}%`}</p>
        </div>
        <div className="rounded-xl bg-neutral-50 p-2">
          <p className="text-xs text-neutral-500">{t('gold.totalMoney')}</p>
          <p className="text-sm font-semibold">
            {value == null ? '—' : formatAmount(value, lang, defaultCurrency)}
          </p>
        </div>
      </div>
      {weight != null ? (
        <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
          <div className="h-full rounded-full bg-[#c9a227]" style={{ width: `${Math.min(weight, 100)}%` }} />
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
