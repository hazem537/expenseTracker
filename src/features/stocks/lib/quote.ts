import { convertAmount, fetchExchangeRate } from '@/features/accounts/lib/exchangeRate'

export function normalizeSymbol(symbol: string) {
  return symbol.trim().toUpperCase()
}

export function tickerBase(symbol: string) {
  return normalizeSymbol(symbol).replace(/\.(CA|EG|CAI)$/, '')
}

export function sameTicker(a: string, b: string) {
  return tickerBase(a) === tickerBase(b) || normalizeSymbol(a) === normalizeSymbol(b)
}

export interface StockQuote {
  symbol: string
  price: number
  currency: string
  name: string
  source: 'EGX' | 'Yahoo'
}

interface TradingViewSymbolResponse {
  close?: number
  currency?: string
  description?: string
  name?: string
}

interface YahooChartResponse {
  chart?: {
    result?: Array<{
      meta?: {
        currency?: string
        symbol?: string
        regularMarketPrice?: number
        regularMarketPreviousClose?: number
        chartPreviousClose?: number
        previousClose?: number
        shortName?: string
        longName?: string
      }
      indicators?: {
        quote?: Array<{ close?: Array<number | null> }>
      }
    }>
    error?: { description?: string }
  }
}

function firstPositive(values: Array<number | null | undefined>): number | null {
  for (const n of values) {
    if (typeof n === 'number' && Number.isFinite(n) && n > 0) return n
  }
  return null
}

async function fetchFirstJson<T>(urls: string[], init?: RequestInit): Promise<T> {
  let lastError: unknown
  for (const url of urls) {
    try {
      const response = await fetch(url, init)
      if (!response.ok) throw new Error('Quote request failed')
      return (await response.json()) as T
    } catch (error) {
      lastError = error
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Quote request failed')
}

async function fetchEgxQuote(rawSymbol: string): Promise<StockQuote> {
  const base = tickerBase(rawSymbol)
  const tvSymbol = `EGX:${base}`
  const fields = 'close,name,currency,description'
  const path = `/symbol?symbol=${encodeURIComponent(tvSymbol)}&fields=${encodeURIComponent(fields)}`
  const data = await fetchFirstJson<TradingViewSymbolResponse>([
    `/api/tv${path}`,
    `https://scanner.tradingview.com${path}`,
  ])
  const price = data.close
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
    throw new Error('EGX quote missing')
  }
  return {
    symbol: normalizeSymbol(data.name || base),
    price,
    currency: data.currency || 'EGP',
    name: data.description || data.name || base,
    source: 'EGX',
  }
}

function parseYahoo(data: YahooChartResponse, fallbackSymbol: string): StockQuote {
  const result = data.chart?.result?.[0]
  const meta = result?.meta
  const closes = result?.indicators?.quote?.[0]?.close ?? []
  const lastClose = [...closes].reverse().find((n) => typeof n === 'number' && n > 0)
  const price = firstPositive([
    meta?.regularMarketPrice,
    meta?.regularMarketPreviousClose,
    meta?.chartPreviousClose,
    meta?.previousClose,
    lastClose,
  ])
  if (price == null) {
    throw new Error(data.chart?.error?.description || 'Quote missing')
  }
  const yahooSymbol = normalizeSymbol(meta?.symbol || fallbackSymbol)
  return {
    symbol: yahooSymbol,
    price,
    currency: meta?.currency || 'USD',
    name: meta?.shortName || meta?.longName || fallbackSymbol,
    source: 'Yahoo',
  }
}

async function fetchYahooQuote(rawSymbol: string): Promise<StockQuote> {
  const symbol = normalizeSymbol(rawSymbol)
  const path = `/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`
  const yahoo = `https://query1.finance.yahoo.com${path}`
  const data = await fetchFirstJson<YahooChartResponse>([`/api/yahoo${path}`, yahoo])
  return parseYahoo(data, symbol)
}

export async function fetchStockQuote(rawSymbol: string): Promise<StockQuote> {
  const symbol = normalizeSymbol(rawSymbol)
  if (!symbol) throw new Error('Symbol required')

  try {
    return await fetchEgxQuote(symbol)
  } catch {
    return await fetchYahooQuote(symbol.includes('.') ? symbol : tickerBase(symbol))
  }
}

export async function convertQuoteAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
) {
  const rate = await fetchExchangeRate(fromCurrency, toCurrency)
  return convertAmount(amount, rate)
}
