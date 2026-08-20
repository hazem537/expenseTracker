import { fetchExchangeRate } from '@/features/accounts/lib/exchangeRate'
import type { CurrencyCode } from '@/shared/lib/currencies'

export const KARATS = [24, 21, 18] as const
export type Karat = (typeof KARATS)[number]

export const GRAMS_PER_TROY_OUNCE = 31.1034768

export function fineGrams(grams: number, karat: Karat) {
  return grams * (karat / 24)
}

export function usdPerGramFromOunce(usdPerOunce: number) {
  return usdPerOunce / GRAMS_PER_TROY_OUNCE
}

export async function fetchGoldUsdPerOunce(): Promise<number> {
  const response = await fetch('https://api.gold-api.com/price/XAU')
  if (!response.ok) throw new Error('Gold price request failed')
  const data = (await response.json()) as { price?: number }
  if (typeof data.price !== 'number' || !Number.isFinite(data.price) || data.price <= 0) {
    throw new Error('Gold price missing')
  }
  return data.price
}

export type KaratPrices = Record<Karat, number>

export function karatPricesFromPureGram(price24: number): KaratPrices {
  return {
    24: Math.round(price24 * 10000) / 10000,
    21: Math.round(price24 * (21 / 24) * 10000) / 10000,
    18: Math.round(price24 * (18 / 24) * 10000) / 10000,
  }
}

export async function fetchKaratPricesInCurrency(currency: CurrencyCode): Promise<KaratPrices> {
  const [ounceUsd, fx] = await Promise.all([
    fetchGoldUsdPerOunce(),
    fetchExchangeRate('USD', currency),
  ])
  const price24 = usdPerGramFromOunce(ounceUsd) * fx
  return karatPricesFromPureGram(price24)
}
