import { useCallback, useEffect, useState } from 'react'
import type { Karat, KaratPrices } from '@/features/gold/lib/gold'
import { supabase } from '@/shared/lib/supabase'

export interface GoldHolding {
  id: string
  user_id: string
  grams: number
  karat: Karat
  note: string | null
  created_at: string
}

export interface GoldHoldingInput {
  grams: number
  karat: Karat
  note: string
}

export function useGoldHoldings() {
  const [holdings, setHoldings] = useState<GoldHolding[]>([])
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
      .from('gold_holdings')
      .select('*')
      .order('created_at', { ascending: false })

    if (queryError) {
      setError(queryError.message)
      setHoldings([])
    } else {
      setHoldings(
        (data ?? []).map((row) => ({
          ...row,
          grams: Number(row.grams),
          karat: Number(row.karat) as Karat,
        })) as GoldHolding[],
      )
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const createHolding = useCallback(
    async (input: GoldHoldingInput) => {
      if (!supabase) throw new Error('Supabase is not configured')
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in')
      const { error: insertError } = await supabase.from('gold_holdings').insert({
        user_id: user.id,
        grams: input.grams,
        karat: input.karat,
        note: input.note.trim() || null,
      })
      if (insertError) throw insertError
      await reload()
    },
    [reload],
  )

  const reduceHolding = useCallback(
    async (id: string, gramsToRemove: number) => {
      if (!supabase) throw new Error('Supabase is not configured')
      const holding = holdings.find((item) => item.id === id)
      if (!holding) throw new Error('Holding not found')
      const next = Math.round((holding.grams - gramsToRemove) * 1000) / 1000
      if (next <= 0.0005) {
        const { error: deleteError } = await supabase.from('gold_holdings').delete().eq('id', id)
        if (deleteError) throw deleteError
      } else {
        const { error: updateError } = await supabase
          .from('gold_holdings')
          .update({ grams: next })
          .eq('id', id)
        if (updateError) throw updateError
      }
      await reload()
    },
    [holdings, reload],
  )

  const addGrams = useCallback(
    async (input: { karat: Karat; grams: number; note?: string }) => {
      if (!supabase) throw new Error('Supabase is not configured')
      const existing = holdings.find((item) => item.karat === input.karat)
      if (existing) {
        const next = Math.round((existing.grams + input.grams) * 1000) / 1000
        const { error: updateError } = await supabase
          .from('gold_holdings')
          .update({ grams: next })
          .eq('id', existing.id)
        if (updateError) throw updateError
      } else {
        await createHolding({
          grams: input.grams,
          karat: input.karat,
          note: input.note ?? '',
        })
        return
      }
      await reload()
    },
    [holdings, reload, createHolding],
  )

  const deleteHolding = useCallback(
    async (id: string) => {
      if (!supabase) throw new Error('Supabase is not configured')
      const { error: deleteError } = await supabase.from('gold_holdings').delete().eq('id', id)
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
    createHolding,
    addGrams,
    reduceHolding,
    deleteHolding,
  }
}

export function estimateGoldValue(grams: number, karat: Karat, prices: KaratPrices | null) {
  if (!prices) return null
  return grams * prices[karat]
}
