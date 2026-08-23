import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchStockQuote, type StockQuote } from '@/features/stocks/lib/quote'
import { queryKeys } from '@/shared/lib/queryKeys'

function sortedSymbolList(symbols: string[]) {
  return [...new Set(symbols.map((s) => s.trim()).filter(Boolean))].sort()
}

async function fetchQuotes(symbols: string[]): Promise<Record<string, StockQuote>> {
  if (symbols.length === 0) return {}

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
  if (failed > 0 && Object.keys(next).length === 0) {
    throw new Error('quotes')
  }
  return next
}

export function useStockQuotes(symbols: string[]) {
  const queryClient = useQueryClient()
  // Sort + dedupe so key order is stable regardless of caller array order.
  const sortedSymbols = sortedSymbolList(symbols)

  const query = useQuery({
    queryKey: queryKeys.stocks.quotes(sortedSymbols),
    queryFn: () => fetchQuotes(sortedSymbols),
    enabled: sortedSymbols.length > 0,
  })

  const refresh = async () => {
    if (sortedSymbols.length === 0) return
    await queryClient.invalidateQueries({ queryKey: queryKeys.stocks.quotes(sortedSymbols) })
  }

  return {
    quotes: query.data ?? {},
    loading: sortedSymbols.length > 0 && (query.isLoading || query.isFetching),
    error: query.error ? 'quotes' : null,
    refresh,
  }
}
