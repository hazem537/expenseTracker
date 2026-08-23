import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { normalizeSymbol, sameTicker } from '@/features/stocks/lib/quote'
import { queryKeys } from '@/shared/lib/queryKeys'
import { supabase } from '@/shared/lib/supabase'

export interface StockHolding {
  id: string
  user_id: string
  symbol: string
  shares: number
  avg_cost: number
  quote_currency: string
  created_at: string
}

export interface StockHoldingInput {
  symbol: string
  shares: number
  avgCost: number
  quoteCurrency: string
}

function mapHolding(row: Record<string, unknown>): StockHolding {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    symbol: String(row.symbol),
    shares: Number(row.shares),
    avg_cost: Number(row.avg_cost),
    quote_currency: String(row.quote_currency),
    created_at: String(row.created_at),
  }
}

function weightedAvg(sharesA: number, costA: number, sharesB: number, costB: number) {
  const total = sharesA + sharesB
  if (total <= 0) return 0
  return Math.round(((sharesA * costA + sharesB * costB) / total) * 1_000_000) / 1_000_000
}

async function fetchStockHoldings(): Promise<StockHolding[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('stock_holdings')
    .select('*')
    .order('symbol', { ascending: true })
  if (error) throw error
  return (data ?? []).map((row) => mapHolding(row as Record<string, unknown>))
}

export function useStockHoldings() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.stocks.holdings,
    queryFn: fetchStockHoldings,
    networkMode: 'offlineFirst',
  })

  const holdings = query.data ?? []

  async function invalidateStocks() {
    await queryClient.invalidateQueries({ queryKey: queryKeys.stocks.all })
  }

  const upsertHolding = useMutation({
    mutationFn: async (input: StockHoldingInput) => {
      if (!supabase) throw new Error('Supabase is not configured')
      const symbol = normalizeSymbol(input.symbol)
      const existing = holdings.find((item) => sameTicker(item.symbol, symbol))
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in')

      if (existing) {
        const shares = existing.shares + input.shares
        const avg_cost = weightedAvg(existing.shares, existing.avg_cost, input.shares, input.avgCost)
        const { error: updateError } = await supabase
          .from('stock_holdings')
          .update({
            symbol,
            shares,
            avg_cost,
            quote_currency: input.quoteCurrency || existing.quote_currency,
          })
          .eq('id', existing.id)
        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase.from('stock_holdings').insert({
          user_id: user.id,
          symbol,
          shares: input.shares,
          avg_cost: input.avgCost,
          quote_currency: input.quoteCurrency,
        })
        if (insertError) throw insertError
      }
    },
    onSuccess: invalidateStocks,
  })

  const reduceShares = useMutation({
    mutationFn: async ({ id, sharesToRemove }: { id: string; sharesToRemove: number }) => {
      if (!supabase) throw new Error('Supabase is not configured')
      const holding = holdings.find((item) => item.id === id)
      if (!holding) throw new Error('Holding not found')
      const next = Math.round((holding.shares - sharesToRemove) * 1_000_000) / 1_000_000
      if (next <= 0.0000005) {
        const { error: deleteError } = await supabase.from('stock_holdings').delete().eq('id', id)
        if (deleteError) throw deleteError
      } else {
        const { error: updateError } = await supabase
          .from('stock_holdings')
          .update({ shares: next })
          .eq('id', id)
        if (updateError) throw updateError
      }
    },
    onSuccess: invalidateStocks,
  })

  const deleteHolding = useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) throw new Error('Supabase is not configured')
      const { error: deleteError } = await supabase.from('stock_holdings').delete().eq('id', id)
      if (deleteError) throw deleteError
    },
    onSuccess: invalidateStocks,
  })

  const reload = async () => {
    await invalidateStocks()
  }

  return {
    holdings,
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    reload,
    upsertHolding: (input: StockHoldingInput) => upsertHolding.mutateAsync(input),
    addShares: async (id: string, shares: number, price: number, quoteCurrency: string) => {
      const holding = holdings.find((item) => item.id === id)
      if (!holding) throw new Error('Holding not found')
      await upsertHolding.mutateAsync({
        symbol: holding.symbol,
        shares,
        avgCost: price,
        quoteCurrency,
      })
    },
    reduceShares: (id: string, sharesToRemove: number) =>
      reduceShares.mutateAsync({ id, sharesToRemove }),
    deleteHolding: (id: string) => deleteHolding.mutateAsync(id),
  }
}
