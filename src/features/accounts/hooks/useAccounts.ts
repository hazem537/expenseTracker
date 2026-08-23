import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CurrencyCode } from '@/shared/lib/currencies'
import { queryKeys } from '@/shared/lib/queryKeys'
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

async function fetchAccountsData(): Promise<{ accounts: Account[]; transfers: Transfer[] }> {
  if (!supabase) return { accounts: [], transfers: [] }

  const [{ data: accountRows, error: accountError }, { data: transferRows, error: transferError }] =
    await Promise.all([
      supabase.from('accounts').select('*').order('created_at', { ascending: true }),
      supabase.from('transfers').select('*').order('occurred_on', { ascending: false }).limit(20),
    ])

  if (accountError) throw accountError
  if (transferError) throw transferError

  return {
    accounts: (accountRows ?? []).map((row) => ({
      ...row,
      balance: Number(row.balance),
    })) as Account[],
    transfers: (transferRows ?? []).map((row) => ({
      ...row,
      from_amount: Number(row.from_amount),
      to_amount: Number(row.to_amount),
      fx_rate: Number(row.fx_rate),
    })) as Transfer[],
  }
}

export function useAccounts() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.accounts.list,
    queryFn: fetchAccountsData,
    networkMode: 'offlineFirst',
  })

  const accounts = query.data?.accounts ?? []
  const transfers = query.data?.transfers ?? []

  async function invalidateAccounts() {
    await queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all })
  }

  const createAccount = useMutation({
    mutationFn: async (input: { name: string; currency: CurrencyCode; openingBalance: number }) => {
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
    },
    onSuccess: invalidateAccounts,
  })

  const addMoney = useMutation({
    mutationFn: async ({ accountId, amount }: { accountId: string; amount: number }) => {
      const account = accounts.find((item) => item.id === accountId)
      if (!account) throw new Error('Account not found')
      await setBalance(accountId, account.balance + amount)
    },
    onSuccess: invalidateAccounts,
  })

  const spendMoney = useMutation({
    mutationFn: async ({ accountId, amount }: { accountId: string; amount: number }) => {
      const account = accounts.find((item) => item.id === accountId)
      if (!account) throw new Error('Account not found')
      if (account.balance < amount) throw new Error('Insufficient funds')
      await setBalance(accountId, account.balance - amount)
    },
    onSuccess: invalidateAccounts,
  })

  const deleteAccount = useMutation({
    mutationFn: async (accountId: string) => {
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
    },
    onSuccess: async () => {
      await Promise.all([
        invalidateAccounts(),
        queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all }),
      ])
    },
  })

  const transfer = useMutation({
    mutationFn: async (input: {
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
    },
    onSuccess: invalidateAccounts,
  })

  const updateAccount = useMutation({
    mutationFn: async ({
      accountId,
      input,
    }: {
      accountId: string
      input: { name: string; currency: CurrencyCode; balance: number }
    }) => {
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
    },
    onSuccess: invalidateAccounts,
  })

  const reload = async () => {
    await invalidateAccounts()
  }

  return {
    accounts,
    transfers,
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    reload,
    createAccount: (input: { name: string; currency: CurrencyCode; openingBalance: number }) =>
      createAccount.mutateAsync(input),
    addMoney: (accountId: string, amount: number) => addMoney.mutateAsync({ accountId, amount }),
    spendMoney: (accountId: string, amount: number) => spendMoney.mutateAsync({ accountId, amount }),
    deleteAccount: (accountId: string) => deleteAccount.mutateAsync(accountId),
    updateAccount: (
      accountId: string,
      input: { name: string; currency: CurrencyCode; balance: number },
    ) => updateAccount.mutateAsync({ accountId, input }),
    transfer: (input: {
      fromAccountId: string
      toAccountId: string
      fromAmount: number
      toAmount: number
      occurredOn: string
      note: string
    }) => transfer.mutateAsync(input),
  }
}
