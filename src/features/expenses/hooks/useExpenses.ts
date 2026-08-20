import { useCallback, useEffect, useState } from 'react'
import type { Category } from '@/features/expenses/lib/categories'
import { supabase } from '@/shared/lib/supabase'

export interface Expense {
  id: string
  user_id: string
  account_id: string
  amount: number
  amount_base: number
  fx_rate: number
  category: Category
  occurred_on: string
  note: string | null
  created_at: string
}

export interface ExpenseInput {
  account_id: string
  amount: number
  amount_base: number
  fx_rate: number
  category: Category
  occurred_on: string
  note: string
}

async function adjustBalance(accountId: string, delta: number) {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('accounts')
    .select('balance')
    .eq('id', accountId)
    .single()
  if (error || !data) throw error ?? new Error('Account not found')
  const next = Number(data.balance) + delta
  const { error: updateError } = await supabase
    .from('accounts')
    .update({ balance: next })
    .eq('id', accountId)
  if (updateError) throw updateError
}

function mapExpense(row: Record<string, unknown>): Expense {
  const amount = Number(row.amount)
  const amountBase = row.amount_base == null ? amount : Number(row.amount_base)
  return {
    ...(row as unknown as Expense),
    amount,
    amount_base: amountBase,
    fx_rate: row.fx_rate == null ? 1 : Number(row.fx_rate),
    account_id: String(row.account_id ?? ''),
  }
}

export function useExpenses(range?: { start: string; end: string }) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!supabase) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    let query = supabase
      .from('expenses')
      .select('*')
      .order('occurred_on', { ascending: false })
      .order('created_at', { ascending: false })

    if (range) {
      query = query.gte('occurred_on', range.start).lte('occurred_on', range.end)
    }

    const { data, error: queryError } = await query

    if (queryError) {
      setError(queryError.message)
      setExpenses([])
    } else {
      setExpenses((data ?? []).map((row) => mapExpense(row as Record<string, unknown>)))
    }
    setLoading(false)
  }, [range?.end, range?.start])

  useEffect(() => {
    void reload()
  }, [reload])

  const createExpense = useCallback(
    async (input: ExpenseInput) => {
      if (!supabase) throw new Error('Supabase is not configured')
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in')

      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select('balance')
        .eq('id', input.account_id)
        .single()
      if (accountError || !account) throw accountError ?? new Error('Account not found')
      if (Number(account.balance) < input.amount) throw new Error('Insufficient funds')

      const { error: insertError } = await supabase.from('expenses').insert({
        user_id: user.id,
        account_id: input.account_id,
        amount: input.amount,
        amount_base: input.amount_base,
        fx_rate: input.fx_rate,
        category: input.category,
        occurred_on: input.occurred_on,
        note: input.note.trim() || null,
      })
      if (insertError) throw insertError
      await adjustBalance(input.account_id, -input.amount)
      await reload()
    },
    [reload],
  )

  const updateExpense = useCallback(
    async (id: string, input: ExpenseInput) => {
      if (!supabase) throw new Error('Supabase is not configured')
      const previous = expenses.find((item) => item.id === id)
      if (!previous) throw new Error('Expense not found')

      await adjustBalance(previous.account_id, previous.amount)

      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select('balance')
        .eq('id', input.account_id)
        .single()
      if (accountError || !account) {
        await adjustBalance(previous.account_id, -previous.amount)
        throw accountError ?? new Error('Account not found')
      }
      if (Number(account.balance) < input.amount) {
        await adjustBalance(previous.account_id, -previous.amount)
        throw new Error('Insufficient funds')
      }

      const { error: updateError } = await supabase
        .from('expenses')
        .update({
          account_id: input.account_id,
          amount: input.amount,
          amount_base: input.amount_base,
          fx_rate: input.fx_rate,
          category: input.category,
          occurred_on: input.occurred_on,
          note: input.note.trim() || null,
        })
        .eq('id', id)
      if (updateError) {
        await adjustBalance(previous.account_id, -previous.amount)
        throw updateError
      }
      await adjustBalance(input.account_id, -input.amount)
      await reload()
    },
    [expenses, reload],
  )

  const deleteExpense = useCallback(
    async (id: string) => {
      if (!supabase) throw new Error('Supabase is not configured')
      const previous = expenses.find((item) => item.id === id)
      const { error: deleteError } = await supabase.from('expenses').delete().eq('id', id)
      if (deleteError) throw deleteError
      if (previous?.account_id) await adjustBalance(previous.account_id, previous.amount)
      await reload()
    },
    [expenses, reload],
  )

  return { expenses, loading, error, reload, createExpense, updateExpense, deleteExpense }
}
