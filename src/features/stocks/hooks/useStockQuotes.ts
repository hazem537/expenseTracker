import { useCallback, useEffect, useState } from 'react'
import { fetchStockQuote, type StockQuote } from '@/features/stocks/lib/quote'

export function useStockQuotes(symbols: string[]) {
  const [quotes, setQuotes] = useState<Record<string, StockQuote>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (symbols.length === 0) {
      setQuotes({})
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    const next: Record<string, StockQuote> = {}
    const results = await Promise.allSettled(symbols.map((symbol) => fetchStockQuote(symbol)))
    let failed = 0
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const quote = result.value
        next[symbols[index]] = quote
        next[quote.symbol] = quote
      } else failed += 1
    })
    setQuotes(next)
    if (failed > 0 && Object.keys(next).length === 0) setError('quotes')
    setLoading(false)
  }, [symbols.join('|')])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { quotes, loading, error, refresh }
}
