import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Category } from '@/features/expenses/lib/categories'
import { createExpenseOnServer } from '@/shared/lib/flushOutbox'
import { isOnline } from '@/shared/lib/online'
import {
  enqueueCreateExpense,
  getOutboxPendingIds,
  refreshOutboxCount,
  subscribeOutbox,
} from '@/shared/lib/outbox'
import { queryKeys } from '@/shared/lib/queryKeys'
import { supabase } from '@/shared/lib/supabase'

export interface Expense {
  id: string
  user_id: string
  account_id: string
  group_id?: string | null
  amount: number
  amount_base: number
  fx_rate: number
  amount_group?: number | null
  group_fx_rate?: number | null
  category: Category
  occurred_on: string
  note: string | null
  created_at: string
  pending?: boolean
}

export interface ExpenseInput {
  account_id: string
  amount: number
  amount_base: number
  fx_rate: number
  amount_group?: number | null
  group_fx_rate?: number | null
  category: Category
  occurred_on: string
  note: string
  group_id?: string | null
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
    amount_group: row.amount_group == null ? null : Number(row.amount_group),
    group_fx_rate: row.group_fx_rate == null ? null : Number(row.group_fx_rate),
    account_id: String(row.account_id ?? ''),
    group_id: row.group_id == null ? null : String(row.group_id),
  }
}

async function fetchExpenses(range?: { start: string; end: string }): Promise<Expense[]> {
  if (!supabase) return []

  let query = supabase
    .from('expenses')
    .select('*')
    .order('occurred_on', { ascending: false })
    .order('created_at', { ascending: false })

  if (range) {
    query = query.gte('occurred_on', range.start).lte('occurred_on', range.end)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map((row) => mapExpense(row as Record<string, unknown>))
}

function mergePendingFlags(expenses: Expense[], pendingIds: Set<string>): Expense[] {
  return expenses.map((item) => (pendingIds.has(item.id) ? { ...item, pending: true } : item))
}

export function useExpenses(range?: { start: string; end: string }) {
  const queryClient = useQueryClient()
  const queryKey = queryKeys.expenses.list(range)
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    let cancelled = false
    async function loadPending() {
      const ids = await getOutboxPendingIds()
      if (!cancelled) setPendingIds(ids)
    }
    void loadPending()
    return subscribeOutbox(() => {
      void loadPending()
    })
  }, [])

  const query = useQuery({
    queryKey,
    queryFn: () => fetchExpenses(range),
    networkMode: 'offlineFirst',
  })

  const expenses = mergePendingFlags(query.data ?? [], pendingIds)

  async function invalidateRelated() {
    void Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all }),
    ])
  }

  async function createExpense(input: ExpenseInput) {
    if (!isOnline()) {
      if (input.group_id) throw new Error('OFFLINE')
      const item = await enqueueCreateExpense(input)
      await refreshOutboxCount()
      const optimistic: Expense = {
        id: item.id,
        user_id: 'local',
        account_id: input.account_id,
        group_id: input.group_id ?? null,
        amount: input.amount,
        amount_base: input.amount_base,
        fx_rate: input.fx_rate,
        amount_group: input.amount_group ?? null,
        group_fx_rate: input.group_fx_rate ?? null,
        category: input.category,
        occurred_on: input.occurred_on,
        note: input.note.trim() || null,
        created_at: item.createdAt,
        pending: true,
      }
      queryClient.setQueriesData<Expense[]>({ queryKey: queryKeys.expenses.all }, (prev) => {
        if (!prev) return [optimistic]
        return [optimistic, ...prev]
      })
      return
    }
    await createExpenseOnServer(input)
    invalidateRelated()
    if (input.group_id) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.expenseGroups.all })
    }
  }

  const updateMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ExpenseInput }) => {
      if (!isOnline()) throw new Error('OFFLINE')
      if (!supabase) throw new Error('Supabase is not configured')
      const previous = expenses.find((item) => item.id === id)
      if (!previous) throw new Error('Expense not found')
      if (previous.pending) throw new Error('OFFLINE')

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
          amount_group: input.group_id ? (input.amount_group ?? null) : null,
          group_fx_rate: input.group_id ? (input.group_fx_rate ?? null) : null,
          category: input.category,
          occurred_on: input.occurred_on,
          note: input.note.trim() || null,
          group_id: input.group_id ?? null,
        })
        .eq('id', id)
      if (updateError) {
        await adjustBalance(previous.account_id, -previous.amount)
        throw updateError
      }
      await adjustBalance(input.account_id, -input.amount)
    },
    onSuccess: () => {
      invalidateRelated()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!isOnline()) throw new Error('OFFLINE')
      if (!supabase) throw new Error('Supabase is not configured')
      const previous = expenses.find((item) => item.id === id)
      if (previous?.pending) throw new Error('OFFLINE')
      const { error: deleteError } = await supabase.from('expenses').delete().eq('id', id)
      if (deleteError) throw deleteError
      if (previous?.account_id) await adjustBalance(previous.account_id, previous.amount)
    },
    onSuccess: () => {
      invalidateRelated()
    },
  })

  const reload = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all }),
    ])
  }

  return {
    expenses,
    loading: query.isLoading && !query.data,
    error: query.error ? (query.error as Error).message : null,
    reload,
    createExpense,
    updateExpense: (id: string, input: ExpenseInput) => updateMutation.mutateAsync({ id, input }),
    deleteExpense: (id: string) => deleteMutation.mutateAsync(id),
  }
}
