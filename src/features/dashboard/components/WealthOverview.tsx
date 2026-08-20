import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { convertAmount, fetchExchangeRate } from '@/features/accounts/lib/exchangeRate'
import type { Account } from '@/features/accounts/hooks/useAccounts'
import { estimateGoldValue, useGoldHoldings } from '@/features/gold/hooks/useGoldHoldings'
import { pricesFromProfile, useProfile } from '@/features/settings'
import { useStockHoldings } from '@/features/stocks/hooks/useStockHoldings'
import { useStockQuotes } from '@/features/stocks/hooks/useStockQuotes'
import { convertQuoteAmount, sameTicker } from '@/features/stocks/lib/quote'
import { formatAmount } from '@/shared/lib/format'

const COLORS = {
  accounts: '#131b2e',
  gold: '#c9a227',
  stocks: '#2f6fed',
}

interface WealthOverviewProps {
  accounts: Account[]
  lang: string
}

export function WealthOverview({ accounts, lang }: WealthOverviewProps) {
  const { t } = useTranslation()
  const { profile, refreshGoldPricesFromApi } = useProfile()
  const defaultCurrency = profile?.default_currency ?? 'USD'
  const goldPrices = pricesFromProfile(profile)
  const { holdings: goldHoldings } = useGoldHoldings()
  const { holdings: stockHoldings } = useStockHoldings()
  const symbols = useMemo(() => stockHoldings.map((item) => item.symbol), [stockHoldings])
  const { quotes } = useStockQuotes(symbols)

  const [accountsValue, setAccountsValue] = useState(0)
  const [stocksValue, setStocksValue] = useState(0)

  const goldValue = useMemo(() => {
    if (!goldPrices) return 0
    return goldHoldings.reduce((sum, item) => sum + (estimateGoldValue(item.grams, item.karat, goldPrices) ?? 0), 0)
  }, [goldHoldings, goldPrices])

  useEffect(() => {
    if (!profile || goldPrices) return
    void refreshGoldPricesFromApi().catch(() => undefined)
  }, [profile, goldPrices, refreshGoldPricesFromApi])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const cache = new Map<string, number>()
      let sum = 0
      for (const account of accounts) {
        let rate = cache.get(account.currency)
        if (rate == null) {
          try {
            rate = await fetchExchangeRate(account.currency, defaultCurrency)
          } catch {
            rate = account.currency === defaultCurrency ? 1 : 0
          }
          cache.set(account.currency, rate)
        }
        sum += convertAmount(account.balance, rate)
      }
      if (!cancelled) setAccountsValue(sum)
    })()
    return () => {
      cancelled = true
    }
  }, [accounts, defaultCurrency])

  useEffect(() => {
    let cancelled = false
    void (async () => {
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
      if (!cancelled) setStocksValue(parts.reduce((sum, n) => sum + n, 0))
    })()
    return () => {
      cancelled = true
    }
  }, [stockHoldings, quotes, defaultCurrency])

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
    'w-full rounded-xl border border-[#c6c6cd] bg-white p-6 shadow-[0px_1px_1.5px_rgba(15,23,42,0.03),0px_10px_10px_rgba(15,23,42,0.05)]'

  return (
    <section className={card}>
      <h2 className="mb-1 text-xl font-semibold leading-7 text-black">{t('dashboard.wealthTitle')}</h2>
      <p className="mb-4 text-2xl font-semibold text-black">{formatAmount(total, lang, defaultCurrency)}</p>
      {total <= 0 ? (
        <p className="text-[#45464d]">{t('dashboard.wealthEmpty')}</p>
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
                  <p className="text-xs text-[#45464d]">{t('dashboard.wealthTotal')}</p>
                  <p className="text-sm font-semibold leading-5 text-black">
                    {formatAmount(total, lang, defaultCurrency)}
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
                  {formatAmount(slice.value, lang, defaultCurrency)} · {((slice.value / total) * 100).toFixed(1)}%
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
