import { useCallback, useEffect, useState } from 'react'
import type { Category } from '../lib/categories'
import { supabase } from '../lib/supabase'

export interface Expense {
  id: string
  user_id: string
  amount: number
  category: Category
  occurred_on: string
  note: string | null
  created_at: string
}

export interface ExpenseInput {
  amount: number
  category: Category
  occurred_on: string
  note: string
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
      setExpenses(
        (data ?? []).map((row) => ({
          ...row,
          amount: Number(row.amount),
        })) as Expense[],
      )
    }
    setLoading(false)
  }, [range?.end, range?.start])

  useEffect(() => {
    void reload()
  }, [reload])

  const createExpense = useCallback(async (input: ExpenseInput) => {
    if (!supabase) throw new Error('Supabase is not configured')
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not signed in')

    const { error: insertError } = await supabase.from('expenses').insert({
      user_id: user.id,
      amount: input.amount,
      category: input.category,
      occurred_on: input.occurred_on,
      note: input.note.trim() || null,
    })
    if (insertError) throw insertError
    await reload()
  }, [reload])

  const updateExpense = useCallback(
    async (id: string, input: ExpenseInput) => {
      if (!supabase) throw new Error('Supabase is not configured')
      const { error: updateError } = await supabase
        .from('expenses')
        .update({
          amount: input.amount,
          category: input.category,
          occurred_on: input.occurred_on,
          note: input.note.trim() || null,
        })
        .eq('id', id)
      if (updateError) throw updateError
      await reload()
    },
    [reload],
  )

  const deleteExpense = useCallback(
    async (id: string) => {
      if (!supabase) throw new Error('Supabase is not configured')
      const { error: deleteError } = await supabase.from('expenses').delete().eq('id', id)
      if (deleteError) throw deleteError
      await reload()
    },
    [reload],
  )

  return { expenses, loading, error, reload, createExpense, updateExpense, deleteExpense }
}
