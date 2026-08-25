import type { ExpenseInput } from '@/features/expenses/hooks/useExpenses'
import { queryClient } from '@/shared/lib/queryClient'
import { queryKeys } from '@/shared/lib/queryKeys'
import { listOutbox, refreshOutboxCount, removeOutboxItem } from '@/shared/lib/outbox'
import { supabase } from '@/shared/lib/supabase'
import { isOnline } from '@/shared/lib/online'

let flushing = false

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

/** Shared online create path used by mutations and outbox flush. */
export async function createExpenseOnServer(input: ExpenseInput, clientId?: string) {
  if (!supabase) throw new Error('Supabase is not configured')
  // getSession is local — getUser() hits the network and can hang the save button
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) throw new Error('Not signed in')

  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('balance')
    .eq('id', input.account_id)
    .single()
  if (accountError || !account) throw accountError ?? new Error('Account not found')
  if (Number(account.balance) < input.amount) throw new Error('Insufficient funds')

  const row: Record<string, unknown> = {
    user_id: user.id,
    account_id: input.account_id,
    amount: input.amount,
    amount_base: input.amount_base,
    fx_rate: input.fx_rate,
    amount_group: input.group_id ? (input.amount_group ?? null) : null,
    group_fx_rate: input.group_id ? (input.group_fx_rate ?? null) : null,
    account_currency: input.account_currency ?? null,
    category: input.category,
    occurred_on: input.occurred_on,
    note: input.note.trim() || null,
  }
  if (input.group_id) row.group_id = input.group_id
  if (clientId) row.id = clientId

  const { error: insertError } = await supabase.from('expenses').insert(row)
  if (insertError) {
    if (clientId) {
      delete row.id
      const { error: retryError } = await supabase.from('expenses').insert(row)
      if (retryError) throw retryError
    } else {
      throw insertError
    }
  }
  await adjustBalance(input.account_id, -input.amount)
}

export async function flushExpenseOutbox() {
  if (!isOnline() || flushing || !supabase) return
  flushing = true
  try {
    const items = await listOutbox()
    for (const item of items) {
      if (item.type !== 'createExpense') continue
      try {
        await createExpenseOnServer(item.payload, item.id)
        await removeOutboxItem(item.id)
      } catch {
        break
      }
    }
    await refreshOutboxCount()
    void Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.expenseGroups.all }),
    ])
  } finally {
    flushing = false
  }
}
