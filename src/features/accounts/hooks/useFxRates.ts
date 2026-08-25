import { useQuery } from '@tanstack/react-query'
import { convertAmount, fetchExchangeRate } from '@/features/accounts/lib/exchangeRate'
import type { Account } from '@/features/accounts/hooks/useAccounts'

export async function fetchRatesToCurrency(fromCodes: string[], toCurrency: string) {
  const unique = [...new Set(fromCodes.filter(Boolean))]
  const rates: Record<string, number> = {}
  for (const from of unique) {
    if (from === toCurrency) {
      rates[from] = 1
      continue
    }
    try {
      rates[from] = await fetchExchangeRate(from, toCurrency)
    } catch {
      rates[from] = 0
    }
  }
  return rates
}

export function useFxRates(fromCodes: string[], toCurrency: string, enabled: boolean) {
  const unique = [...new Set(fromCodes.filter(Boolean))].sort()
  return useQuery({
    queryKey: ['fx', 'latest', toCurrency, unique] as const,
    queryFn: () => fetchRatesToCurrency(unique, toCurrency),
    enabled: enabled && unique.length > 0,
    staleTime: 5 * 60 * 1000,
  })
}

export function accountBalanceWeights(
  accounts: Account[],
  toCurrency: string,
  rates: Record<string, number> | undefined,
) {
  if (accounts.length === 0) return {}
  const converted: Record<string, number> = {}
  let total = 0
  for (const account of accounts) {
    const rate =
      account.currency === toCurrency ? 1 : (rates?.[account.currency] ?? 0)
    const value = convertAmount(account.balance, rate)
    converted[account.id] = value
    total += value
  }
  if (total <= 0) return {}
  const next: Record<string, number> = {}
  for (const account of accounts) {
    next[account.id] = ((converted[account.id] ?? 0) / total) * 100
  }
  return next
}

export function accountsValueInCurrency(
  accounts: Account[],
  toCurrency: string,
  rates: Record<string, number> | undefined,
) {
  let sum = 0
  for (const account of accounts) {
    const rate =
      account.currency === toCurrency ? 1 : (rates?.[account.currency] ?? 0)
    sum += convertAmount(account.balance, rate)
  }
  return sum
}
