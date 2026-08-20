import { useCallback, useEffect, useState } from 'react'
import { fetchKaratPricesInCurrency, type KaratPrices } from '@/features/gold/lib/gold'
import type { CurrencyCode } from '@/shared/lib/currencies'
import { supabase } from '@/shared/lib/supabase'

export interface Profile {
  user_id: string
  default_currency: CurrencyCode
  gold_price_24: number | null
  gold_price_21: number | null
  gold_price_18: number | null
}

function mapProfile(row: Record<string, unknown>): Profile {
  return {
    user_id: String(row.user_id),
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

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!supabase) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    const { data, error: queryError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (queryError) {
      setError(queryError.message)
      setLoading(false)
      return
    }

    if (!data) {
      const { data: created, error: insertError } = await supabase
        .from('profiles')
        .insert({ user_id: user.id, default_currency: 'USD' })
        .select()
        .single()
      if (insertError) {
        setError(insertError.message)
        setLoading(false)
        return
      }
      setProfile(mapProfile(created as Record<string, unknown>))
    } else {
      setProfile(mapProfile(data as Record<string, unknown>))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const saveDefaultCurrency = useCallback(
    async (default_currency: CurrencyCode) => {
      if (!supabase || !profile) throw new Error('Not ready')
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ default_currency, updated_at: new Date().toISOString() })
        .eq('user_id', profile.user_id)
      if (updateError) throw updateError
      await reload()
    },
    [profile, reload],
  )

  const saveGoldPrices = useCallback(
    async (prices: KaratPrices) => {
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
      await reload()
    },
    [profile, reload],
  )

  const refreshGoldPricesFromApi = useCallback(async () => {
    if (!profile) throw new Error('Not ready')
    const prices = await fetchKaratPricesInCurrency(profile.default_currency)
    await saveGoldPrices(prices)
    return prices
  }, [profile, saveGoldPrices])

  return {
    profile,
    loading,
    error,
    reload,
    saveDefaultCurrency,
    saveGoldPrices,
    refreshGoldPricesFromApi,
  }
}
