import { fetchExchangeRate } from '@/features/accounts/lib/exchangeRate'
import type { CurrencyCode } from '@/shared/lib/currencies'

export const KARATS = [24, 21, 18] as const
export type Karat = (typeof KARATS)[number]

export const GRAMS_PER_TROY_OUNCE = 31.1034768

/** Currencies goldprice.dev /v1/carat quotes directly (no extra FX hop). */
const GOLDPRICE_DEV_CURRENCIES = new Set([
  'AUD',
  'BGN',
  'BRL',
  'CAD',
  'CHF',
  'CNY',
  'CZK',
  'DKK',
  'EUR',
  'GBP',
  'HKD',
  'HUF',
  'IDR',
  'ILS',
  'INR',
  'ISK',
  'JPY',
  'KRW',
  'MXN',
  'MYR',
  'NOK',
  'NZD',
  'PHP',
  'PLN',
  'RON',
  'SEK',
  'SGD',
  'THB',
  'TRY',
  'USD',
  'ZAR',
])

export function fineGrams(grams: number, karat: Karat) {
  return grams * (karat / 24)
}

export function usdPerGramFromOunce(usdPerOunce: number) {
  return usdPerOunce / GRAMS_PER_TROY_OUNCE
}

export type KaratPrices = Record<Karat, number>

export function karatPricesFromPureGram(price24: number): KaratPrices {
  return {
    24: Math.round(price24 * 10000) / 10000,
    21: Math.round(price24 * (21 / 24) * 10000) / 10000,
    18: Math.round(price24 * (18 / 24) * 10000) / 10000,
  }
}

function parseGramPrice(value: unknown) {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n) || n <= 0) throw new Error('Gold price missing')
  return n
}

function scaleKaratPrices(prices: KaratPrices, factor: number): KaratPrices {
  return karatPricesFromPureGram(prices[24] * factor)
}

async function fetchKaratPricesFromGoldPriceDev(currency: CurrencyCode): Promise<KaratPrices> {
  const quote = GOLDPRICE_DEV_CURRENCIES.has(currency) ? currency : 'USD'
  const response = await fetch(`https://api.goldprice.dev/v1/carat?currency=${quote}`)
  if (!response.ok) throw new Error('Gold price request failed')
  const data = (await response.json()) as Record<string, unknown>
  const prices: KaratPrices = {
    24: parseGramPrice(data.price_gram_24k),
    21: parseGramPrice(data.price_gram_21k),
    18: parseGramPrice(data.price_gram_18k),
  }
  if (quote === currency) return prices
  const fx = await fetchExchangeRate('USD', currency)
  return scaleKaratPrices(prices, fx)
}

async function fetchGoldUsdPerOunceFallback(): Promise<number> {
  const response = await fetch('https://api.gold-api.com/price/XAU')
  if (!response.ok) throw new Error('Gold price request failed')
  const data = (await response.json()) as { price?: number }
  if (typeof data.price !== 'number' || !Number.isFinite(data.price) || data.price <= 0) {
    throw new Error('Gold price missing')
  }
  return data.price
}

export async function fetchKaratPricesInCurrency(currency: CurrencyCode): Promise<KaratPrices> {
  try {
    return await fetchKaratPricesFromGoldPriceDev(currency)
  } catch {
    const [ounceUsd, fx] = await Promise.all([
      fetchGoldUsdPerOunceFallback(),
      fetchExchangeRate('USD', currency),
    ])
    return karatPricesFromPureGram(usdPerGramFromOunce(ounceUsd) * fx)
  }
}
