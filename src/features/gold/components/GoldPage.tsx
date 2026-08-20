import { Plus, TrendingDown, TrendingUp } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useAccounts } from '@/features/accounts'
import { GoldFormDialog } from '@/features/gold/components/GoldFormDialog'
import { GoldHoldingRow } from '@/features/gold/components/GoldHoldingRow'
import { GoldTradeDialog, type GoldTradeSide } from '@/features/gold/components/GoldTradeDialog'
import { estimateGoldValue, useGoldHoldings } from '@/features/gold/hooks/useGoldHoldings'
import { pricesFromProfile, useProfile } from '@/features/settings'
import { isSupabaseConfigured } from '@/shared/lib/supabase'
import { MoneyText } from '@/shared/ui/HideMoney'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { SetupNotice } from '@/shared/ui/SetupNotice'

export function GoldPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const { profile, refreshGoldPricesFromApi } = useProfile()
  const { accounts, addMoney, spendMoney } = useAccounts()
  const { holdings, loading, error, addGrams, reduceHolding, deleteHolding } = useGoldHoldings()
  const prices = pricesFromProfile(profile)
  const defaultCurrency = profile?.default_currency ?? 'USD'

  const [addOpen, setAddOpen] = useState(false)
  const [trade, setTrade] = useState<{ side: GoldTradeSide; holdingId?: string } | null>(null)
  const [deleteHoldingId, setDeleteHoldingId] = useState<string | null>(null)
  const fetchedDefaultPrices = useRef(false)

  useEffect(() => {
    if (!profile || prices || fetchedDefaultPrices.current) return
    fetchedDefaultPrices.current = true
    void refreshGoldPricesFromApi().catch(() => {
      fetchedDefaultPrices.current = false
    })
  }, [profile, prices, refreshGoldPricesFromApi])

  const totalGrams = useMemo(
    () => holdings.reduce((sum, item) => sum + item.grams, 0),
    [holdings],
  )
  const totalValue = useMemo(() => {
    if (!prices) return null
    return holdings.reduce((sum, item) => sum + (estimateGoldValue(item.grams, item.karat, prices) ?? 0), 0)
  }, [holdings, prices])

  return (
    <div className="space-y-6">
      {!isSupabaseConfigured ? <SetupNotice /> : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-heading">{t('app.navGold')}</h1>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={holdings.length === 0 || accounts.length === 0}
            onClick={() => setTrade({ side: 'sell' })}
          >
            <TrendingDown />
            {t('gold.sell')}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={accounts.length === 0}
            onClick={() => setTrade({ side: 'buy' })}
          >
            <TrendingUp />
            {t('gold.buy')}
          </Button>
          <Button type="button" variant="gold" className="rounded-xl" onClick={() => setAddOpen(true)}>
            <Plus />
            {t('gold.add')}
          </Button>
        </div>
      </div>
      {loading ? <p>{t('app.loading')}</p> : null}
      {error ? <p className="text-red-600">{t('expense.error')}</p> : null}
      {!prices ? <p className="text-sm text-amber-700">{t('gold.setPricesFirst')}</p> : null}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-gold/40 bg-gradient-to-br from-navy to-navy-mid p-4">
          <p className="text-sm text-gold-soft">{t('gold.totalGrams')}</p>
          <p className="text-xl font-semibold text-gold-bright">{totalGrams.toFixed(3)} g</p>
        </div>
        <div className="rounded-2xl border border-gold/40 bg-gradient-to-br from-navy to-navy-mid p-4">
          <p className="text-sm text-gold-soft">{t('gold.totalMoney')}</p>
          <p className="text-xl font-semibold text-gold-bright">
            {totalValue == null ? '—' : <MoneyText amount={totalValue} lang={lang} currency={defaultCurrency} />}
          </p>
        </div>
      </div>
      <ul className="space-y-2">
        {holdings.map((item) => {
          const value = estimateGoldValue(item.grams, item.karat, prices)
          const weight = value != null && totalValue ? (value / totalValue) * 100 : null
          return (
            <GoldHoldingRow
              key={item.id}
              item={item}
              prices={prices}
              weight={weight}
              lang={lang}
              defaultCurrency={defaultCurrency}
              canTrade={accounts.length > 0 && prices != null}
              onBuy={() => setTrade({ side: 'buy', holdingId: item.id })}
              onSell={() => setTrade({ side: 'sell', holdingId: item.id })}
              onDelete={() => setDeleteHoldingId(item.id)}
            />
          )
        })}
      </ul>
      {!loading && holdings.length === 0 ? (
        <p className="text-sm text-muted">{t('gold.empty')}</p>
      ) : null}
      <ConfirmDialog
        open={deleteHoldingId != null}
        description={t('gold.confirmDelete')}
        onOpenChange={(open) => {
          if (!open) setDeleteHoldingId(null)
        }}
        onConfirm={async () => {
          if (deleteHoldingId) await deleteHolding(deleteHoldingId)
        }}
      />
      <GoldFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={async (values) => {
          await addGrams({ karat: values.karat, grams: values.grams, note: values.note })
        }}
      />
      <GoldTradeDialog
        open={trade != null}
        side={trade?.side ?? 'buy'}
        targetHoldingId={trade?.holdingId}
        holdings={holdings}
        accounts={accounts}
        prices={prices}
        defaultCurrency={defaultCurrency}
        lang={lang}
        onOpenChange={(open) => {
          if (!open) setTrade(null)
        }}
        onSubmit={async ({ side, holdingId, karat, grams, accountId, moneyAmount }) => {
          if (side === 'buy') {
            await spendMoney(accountId, moneyAmount)
            await addGrams({ karat, grams })
          } else {
            if (!holdingId) throw new Error('Holding required')
            await addMoney(accountId, moneyAmount)
            await reduceHolding(holdingId, grams)
          }
        }}
      />
    </div>
  )
}
