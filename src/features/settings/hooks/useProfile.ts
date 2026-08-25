import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchKaratPricesInCurrency, type KaratPrices } from '@/features/gold/lib/gold'
import { DEFAULT_CURRENCY, type CurrencyCode } from '@/shared/lib/currencies'
import { queryKeys } from '@/shared/lib/queryKeys'
import { supabase } from '@/shared/lib/supabase'

export interface Profile {
  user_id: string
  display_name: string | null
  default_currency: CurrencyCode
  gold_price_24: number | null
  gold_price_21: number | null
  gold_price_18: number | null
}

function mapProfile(row: Record<string, unknown>): Profile {
  return {
    user_id: String(row.user_id),
    display_name: row.display_name == null ? null : String(row.display_name),
    default_currency: row.default_currency as CurrencyCode,
    gold_price_24: row.gold_price_24 == null ? null : Number(row.gold_price_24),
    gold_price_21: row.gold_price_21 == null ? null : Number(row.gold_price_21),
    gold_price_18: row.gold_price_18 == null ? null : Number(row.gold_price_18),
  }
}

export function pricesFromProfile(profile: Profile | null): KaratPrices | null {
  if (
    !profile ||
    profile.gold_price_24 == null ||
    profile.gold_price_21 == null ||
    profile.gold_price_18 == null
  ) {
    return null
  }
  return {
    24: profile.gold_price_24,
    21: profile.gold_price_21,
    18: profile.gold_price_18,
  }
}

async function fetchProfile(): Promise<Profile | null> {
  if (!supabase) return null
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw error

  if (!data) {
    const { data: created, error: insertError } = await supabase
      .from('profiles')
      .insert({ user_id: user.id, default_currency: DEFAULT_CURRENCY })
      .select()
      .single()
    if (insertError) throw insertError
    return mapProfile(created as Record<string, unknown>)
  }

  return mapProfile(data as Record<string, unknown>)
}

export function useProfile() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.profile.current,
    queryFn: fetchProfile,
    networkMode: 'offlineFirst',
  })

  const profile = query.data ?? null

  async function invalidateProfile() {
    await queryClient.invalidateQueries({ queryKey: queryKeys.profile.all })
  }

  const saveDisplayName = useMutation({
    mutationFn: async (display_name: string) => {
      if (!supabase || !profile) throw new Error('Not ready')
      const trimmed = display_name.trim()
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          display_name: trimmed || null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', profile.user_id)
      if (updateError) throw updateError
    },
    onSuccess: invalidateProfile,
  })

  const saveDefaultCurrency = useMutation({
    mutationFn: async (default_currency: CurrencyCode) => {
      if (!supabase || !profile) throw new Error('Not ready')
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ default_currency, updated_at: new Date().toISOString() })
        .eq('user_id', profile.user_id)
      if (updateError) throw updateError
    },
    onSuccess: invalidateProfile,
  })

  const saveGoldPrices = useMutation({
    mutationFn: async (prices: KaratPrices) => {
      if (!supabase || !profile) throw new Error('Not ready')
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          gold_price_24: prices[24],
          gold_price_21: prices[21],
          gold_price_18: prices[18],
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', profile.user_id)
      if (updateError) throw updateError
    },
    onSuccess: invalidateProfile,
  })

  const reload = async () => {
    await invalidateProfile()
  }

  return {
    profile,
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    reload,
    saveDisplayName: (display_name: string) => saveDisplayName.mutateAsync(display_name),
    saveDefaultCurrency: (default_currency: CurrencyCode) =>
      saveDefaultCurrency.mutateAsync(default_currency),
    saveGoldPrices: (prices: KaratPrices) => saveGoldPrices.mutateAsync(prices),
    refreshGoldPricesFromApi: async () => {
      if (!profile) throw new Error('Not ready')
      const prices = await fetchKaratPricesInCurrency(profile.default_currency)
      await saveGoldPrices.mutateAsync(prices)
      return prices
    },
  }
}
