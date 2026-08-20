import { useCallback, useEffect, useState } from 'react'
import type { CurrencyCode } from '@/shared/lib/currencies'
import { supabase } from '@/shared/lib/supabase'

export interface Account {
  id: string
  user_id: string
  name: string
  currency: CurrencyCode
  balance: number
  created_at: string
}

export interface Transfer {
  id: string
  user_id: string
  from_account_id: string
  to_account_id: string
  from_amount: number
  to_amount: number
  fx_rate: number
  occurred_on: string
  note: string | null
}

async function setBalance(accountId: string, next: number) {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase.from('accounts').update({ balance: next }).eq('id', accountId)
  if (error) throw error
}

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!supabase) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const [{ data: accountRows, error: accountError }, { data: transferRows, error: transferError }] =
      await Promise.all([
        supabase.from('accounts').select('*').order('created_at', { ascending: true }),
        supabase.from('transfers').select('*').order('occurred_on', { ascending: false }).limit(20),
      ])

    if (accountError) setError(accountError.message)
    else {
      setAccounts(
        (accountRows ?? []).map((row) => ({ ...row, balance: Number(row.balance) })) as Account[],
      )
    }

    if (transferError) setError(transferError.message)
    else {
      setTransfers(
        (transferRows ?? []).map((row) => ({
          ...row,
          from_amount: Number(row.from_amount),
          to_amount: Number(row.to_amount),
          fx_rate: Number(row.fx_rate),
        })) as Transfer[],
      )
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const createAccount = useCallback(
    async (input: { name: string; currency: CurrencyCode; openingBalance: number }) => {
      if (!supabase) throw new Error('Supabase is not configured')
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in')
      const { error: insertError } = await supabase.from('accounts').insert({
        user_id: user.id,
        name: input.name.trim(),
        currency: input.currency,
        balance: input.openingBalance,
      })
      if (insertError) throw insertError
      await reload()
    },
    [reload],
  )

  const addMoney = useCallback(
    async (accountId: string, amount: number) => {
      const account = accounts.find((item) => item.id === accountId)
      if (!account) throw new Error('Account not found')
      await setBalance(accountId, account.balance + amount)
      await reload()
    },
    [accounts, reload],
  )

  const spendMoney = useCallback(
    async (accountId: string, amount: number) => {
      const account = accounts.find((item) => item.id === accountId)
      if (!account) throw new Error('Account not found')
      if (account.balance < amount) throw new Error('Insufficient funds')
      await setBalance(accountId, account.balance - amount)
      await reload()
    },
    [accounts, reload],
  )

  const deleteAccount = useCallback(
    async (accountId: string) => {
      if (!supabase) throw new Error('Supabase is not configured')
      const { count, error: expenseError } = await supabase
        .from('expenses')
        .select('id', { count: 'exact', head: true })
        .eq('account_id', accountId)
      if (expenseError) throw expenseError
      if ((count ?? 0) > 0) throw new Error('HAS_EXPENSES')

      const { error: transferError } = await supabase
        .from('transfers')
        .delete()
        .or(`from_account_id.eq.${accountId},to_account_id.eq.${accountId}`)
      if (transferError) throw transferError

      const { error: deleteError } = await supabase.from('accounts').delete().eq('id', accountId)
      if (deleteError) throw deleteError
      await reload()
    },
    [reload],
  )

  const transfer = useCallback(
    async (input: {
      fromAccountId: string
      toAccountId: string
      fromAmount: number
      toAmount: number
      occurredOn: string
      note: string
    }) => {
      if (!supabase) throw new Error('Supabase is not configured')
      const from = accounts.find((item) => item.id === input.fromAccountId)
      const to = accounts.find((item) => item.id === input.toAccountId)
      if (!from || !to) throw new Error('Account not found')
      if (from.id === to.id) throw new Error('Same account')
      if (from.balance < input.fromAmount) throw new Error('Insufficient funds')

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in')

      const fx_rate = input.fromAmount === 0 ? 1 : input.toAmount / input.fromAmount
      const { error: insertError } = await supabase.from('transfers').insert({
        user_id: user.id,
        from_account_id: from.id,
        to_account_id: to.id,
        from_amount: input.fromAmount,
        to_amount: input.toAmount,
        fx_rate,
        occurred_on: input.occurredOn,
        note: input.note.trim() || null,
      })
      if (insertError) throw insertError

      await setBalance(from.id, from.balance - input.fromAmount)
      await setBalance(to.id, to.balance + input.toAmount)
      await reload()
    },
    [accounts, reload],
  )

  const updateAccount = useCallback(
    async (accountId: string, input: { name: string; currency: CurrencyCode; balance: number }) => {
      if (!supabase) throw new Error('Supabase is not configured')
      const { error: updateError } = await supabase
        .from('accounts')
        .update({
          name: input.name.trim(),
          currency: input.currency,
          balance: input.balance,
        })
        .eq('id', accountId)
      if (updateError) throw updateError
      await reload()
    },
    [reload],
  )

  return { accounts, transfers, loading, error, reload, createAccount, addMoney, spendMoney, deleteAccount, updateAccount, transfer }
}
