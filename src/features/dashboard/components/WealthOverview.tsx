import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import type { Account } from '@/features/accounts/hooks/useAccounts'
import { accountsValueInCurrency, useFxRates } from '@/features/accounts/hooks/useFxRates'
import { estimateGoldValue, useGoldHoldings } from '@/features/gold/hooks/useGoldHoldings'
import { pricesFromProfile, useProfile } from '@/features/settings'
import { useStockHoldings } from '@/features/stocks/hooks/useStockHoldings'
import { useStockQuotes } from '@/features/stocks/hooks/useStockQuotes'
import { convertQuoteAmount, sameTicker } from '@/features/stocks/lib/quote'
import { DEFAULT_CURRENCY } from '@/shared/lib/currencies'
import { MoneyText } from '@/shared/ui/HideMoney'

const COLORS = {
  accounts: '#0c1424',
  gold: '#c9a227',
  stocks: '#1b7a52',
}

interface WealthOverviewProps {
  accounts: Account[]
  lang: string
}

export function WealthOverview({ accounts, lang }: WealthOverviewProps) {
  const { t } = useTranslation()
  const { profile, refreshGoldPricesFromApi } = useProfile()
  const defaultCurrency = profile?.default_currency ?? DEFAULT_CURRENCY
  const goldPrices = pricesFromProfile(profile)
  const { holdings: goldHoldings } = useGoldHoldings()
  const { holdings: stockHoldings } = useStockHoldings()
  const symbols = useMemo(() => stockHoldings.map((item) => item.symbol), [stockHoldings])
  const { quotes } = useStockQuotes(symbols)

  const goldValue = useMemo(() => {
    if (!goldPrices) return 0
    return goldHoldings.reduce((sum, item) => sum + (estimateGoldValue(item.grams, item.karat, goldPrices) ?? 0), 0)
  }, [goldHoldings, goldPrices])

  useQuery({
    queryKey: ['gold', 'autoPrices', profile?.user_id] as const,
    queryFn: () => refreshGoldPricesFromApi(),
    enabled: Boolean(profile) && !goldPrices,
    retry: false,
  })

  const accountCurrencies = useMemo(
    () => [...new Set(accounts.map((item) => item.currency))],
    [accounts],
  )
  const needsAccountFx = accountCurrencies.some((code) => code !== defaultCurrency)
  const { data: accountRates } = useFxRates(accountCurrencies, defaultCurrency, needsAccountFx)
  const accountsValue = accountsValueInCurrency(accounts, defaultCurrency, accountRates)

  const stockFingerprint = stockHoldings
    .map((item) => `${item.symbol}:${item.shares}:${quotes[item.symbol]?.price ?? ''}`)
    .join('|')
  const { data: stocksValue = 0 } = useQuery({
    queryKey: ['wealth', 'stocks', defaultCurrency, stockFingerprint] as const,
    queryFn: async () => {
      const parts = await Promise.all(
        stockHoldings.map(async (item) => {
          const quote =
            quotes[item.symbol] ?? Object.values(quotes).find((q) => sameTicker(q.symbol, item.symbol))
          if (!quote) return 0
          try {
            return await convertQuoteAmount(quote.price * item.shares, quote.currency, defaultCurrency)
          } catch {
            return 0
          }
        }),
      )
      return parts.reduce((sum, n) => sum + n, 0)
    },
    enabled: stockHoldings.length > 0,
  })

  const slices = [
    { key: 'accounts' as const, label: t('dashboard.wealthAccounts'), value: accountsValue, color: COLORS.accounts },
    { key: 'gold' as const, label: t('dashboard.wealthGold'), value: goldValue, color: COLORS.gold },
    { key: 'stocks' as const, label: t('dashboard.wealthStocks'), value: stocksValue, color: COLORS.stocks },
  ].filter((slice) => slice.value > 0)

  const total = slices.reduce((sum, slice) => sum + slice.value, 0)

  const donutGradient = useMemo(() => {
    if (total <= 0) return '#eae7e9'
    let start = 0
    const stops = slices.map((slice) => {
      const end = start + (slice.value / total) * 360
      const stop = `${slice.color} ${start}deg ${end}deg`
      start = end
      return stop
    })
    return `conic-gradient(${stops.join(', ')})`
  }, [slices, total])

  const card =
    'w-full rounded-xl border border-gold-soft/80 bg-surface p-6 shadow-[0_12px_28px_rgba(201,162,39,0.1)]'

  return (
    <section className={card}>
      <h2 className="mb-1 text-xl font-semibold leading-7 text-heading">{t('dashboard.wealthTitle')}</h2>
      <p className="mb-4 text-2xl font-semibold text-heading">
        <MoneyText amount={total} lang={lang} currency={defaultCurrency} />
      </p>
      {total <= 0 ? (
        <p className="text-muted">{t('dashboard.wealthEmpty')}</p>
      ) : (
        <>
          <div className="flex h-44 items-center justify-center pb-4">
            <div className="relative size-40 shrink-0">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: donutGradient,
                  WebkitMask:
                    'radial-gradient(farthest-side, transparent calc(100% - 16px), #000 calc(100% - 15.5px))',
                  mask: 'radial-gradient(farthest-side, transparent calc(100% - 16px), #000 calc(100% - 15.5px))',
                }}
                aria-hidden
              />
              <div className="absolute inset-0 flex items-center justify-center px-3 text-center">
                <div>
                  <p className="text-xs text-muted">{t('dashboard.wealthTotal')}</p>
                  <p className="text-sm font-semibold leading-5 text-heading">
                    <MoneyText amount={total} lang={lang} currency={defaultCurrency} />
                  </p>
                </div>
              </div>
            </div>
          </div>
          <ul className="space-y-2 text-sm">
            {slices.map((slice) => (
              <li key={slice.key} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <span className="size-3 shrink-0 rounded-full" style={{ background: slice.color }} />
                  {slice.label}
                </span>
                <span className="font-medium">
                  <MoneyText amount={slice.value} lang={lang} currency={defaultCurrency} /> ·{' '}
                  {((slice.value / total) * 100).toFixed(1)}%
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
