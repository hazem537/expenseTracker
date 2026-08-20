import { useCallback, useEffect, useState } from 'react'
import { normalizeSymbol, sameTicker } from '@/features/stocks/lib/quote'
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

export function useStockHoldings() {
  const [holdings, setHoldings] = useState<StockHolding[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!supabase) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const { data, error: queryError } = await supabase
      .from('stock_holdings')
      .select('*')
      .order('symbol', { ascending: true })

    if (queryError) {
      setError(queryError.message)
      setHoldings([])
    } else {
      setHoldings((data ?? []).map((row) => mapHolding(row as Record<string, unknown>)))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const upsertHolding = useCallback(
    async (input: StockHoldingInput) => {
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
      await reload()
    },
    [holdings, reload],
  )

  const addShares = useCallback(
    async (id: string, shares: number, price: number, quoteCurrency: string) => {
      const holding = holdings.find((item) => item.id === id)
      if (!holding) throw new Error('Holding not found')
      await upsertHolding({
        symbol: holding.symbol,
        shares,
        avgCost: price,
        quoteCurrency,
      })
    },
    [holdings, upsertHolding],
  )

  const reduceShares = useCallback(
    async (id: string, sharesToRemove: number) => {
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
      await reload()
    },
    [holdings, reload],
  )

  const deleteHolding = useCallback(
    async (id: string) => {
      if (!supabase) throw new Error('Supabase is not configured')
      const { error: deleteError } = await supabase.from('stock_holdings').delete().eq('id', id)
      if (deleteError) throw deleteError
      await reload()
    },
    [reload],
  )

  return {
    holdings,
    loading,
    error,
    reload,
    upsertHolding,
    addShares,
    reduceShares,
    deleteHolding,
  }
}
