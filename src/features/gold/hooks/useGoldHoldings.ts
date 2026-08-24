import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Karat, KaratPrices } from '@/features/gold/lib/gold'
import { queryKeys } from '@/shared/lib/queryKeys'
import { supabase } from '@/shared/lib/supabase'

export interface GoldHolding {
  id: string
  user_id: string
  grams: number
  karat: Karat
  avg_cost: number
  note: string | null
  created_at: string
}

export interface GoldHoldingInput {
  grams: number
  karat: Karat
  avgCost: number
  note: string
}

function weightedAvg(gramsA: number, costA: number, gramsB: number, costB: number) {
  const total = gramsA + gramsB
  if (total <= 0) return 0
  return Math.round(((gramsA * costA + gramsB * costB) / total) * 1_000_000) / 1_000_000
}

async function fetchGoldHoldings(): Promise<GoldHolding[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('gold_holdings')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => ({
    ...row,
    grams: Number(row.grams),
    karat: Number(row.karat) as Karat,
    avg_cost: Number(row.avg_cost ?? 0),
  })) as GoldHolding[]
}

export function useGoldHoldings() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.gold.holdings,
    queryFn: fetchGoldHoldings,
    networkMode: 'offlineFirst',
  })

  const holdings = query.data ?? []

  async function invalidateGold() {
    await queryClient.invalidateQueries({ queryKey: queryKeys.gold.all })
  }

  const createHolding = useMutation({
    mutationFn: async (input: GoldHoldingInput) => {
      if (!supabase) throw new Error('Supabase is not configured')
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in')
      const { error: insertError } = await supabase.from('gold_holdings').insert({
        user_id: user.id,
        grams: input.grams,
        karat: input.karat,
        avg_cost: input.avgCost,
        note: input.note.trim() || null,
      })
      if (insertError) throw insertError
    },
    onSuccess: invalidateGold,
  })

  const reduceHolding = useMutation({
    mutationFn: async ({ id, gramsToRemove }: { id: string; gramsToRemove: number }) => {
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
    },
    onSuccess: invalidateGold,
  })

  const addGrams = useMutation({
    mutationFn: async (input: { karat: Karat; grams: number; avgCost?: number; note?: string }) => {
      if (!supabase) throw new Error('Supabase is not configured')
      const paid = input.avgCost ?? 0
      const existing = holdings.find((item) => item.karat === input.karat)
      if (existing) {
        const next = Math.round((existing.grams + input.grams) * 1000) / 1000
        const avg_cost = weightedAvg(existing.grams, existing.avg_cost, input.grams, paid)
        const { error: updateError } = await supabase
          .from('gold_holdings')
          .update({ grams: next, avg_cost })
          .eq('id', existing.id)
        if (updateError) throw updateError
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) throw new Error('Not signed in')
        const { error: insertError } = await supabase.from('gold_holdings').insert({
          user_id: user.id,
          grams: input.grams,
          karat: input.karat,
          avg_cost: paid,
          note: (input.note ?? '').trim() || null,
        })
        if (insertError) throw insertError
      }
    },
    onSuccess: invalidateGold,
  })

  const deleteHolding = useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) throw new Error('Supabase is not configured')
      const { error: deleteError } = await supabase.from('gold_holdings').delete().eq('id', id)
      if (deleteError) throw deleteError
    },
    onSuccess: invalidateGold,
  })

  const reload = async () => {
    await invalidateGold()
  }

  return {
    holdings,
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    reload,
    createHolding: (input: GoldHoldingInput) => createHolding.mutateAsync(input),
    addGrams: (input: { karat: Karat; grams: number; avgCost?: number; note?: string }) =>
      addGrams.mutateAsync(input),
    reduceHolding: (id: string, gramsToRemove: number) =>
      reduceHolding.mutateAsync({ id, gramsToRemove }),
    deleteHolding: (id: string) => deleteHolding.mutateAsync(id),
  }
}

export function estimateGoldValue(grams: number, karat: Karat, prices: KaratPrices | null) {
  if (!prices) return null
  return grams * prices[karat]
}
