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
  share_code: string | null
  hide_on_dashboard: boolean
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

export interface AccountMember {
  user_id: string
  display_name: string | null
  email: string | null
}

function generateShareCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  let code = ''
  for (const b of bytes) code += alphabet[b % alphabet.length]
  return code
}

function memberLabel(row: AccountMember, fallback: string) {
  const name = row.display_name?.trim()
  if (name) return name
  if (row.email) return row.email
  return fallback
}

async function setBalance(accountId: string, next: number) {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase.from('accounts').update({ balance: next }).eq('id', accountId)
  if (error) throw error
}

async function fetchAccountsData(): Promise<{
  accounts: Account[]
  transfers: Transfer[]
  memberLabels: Record<string, string>
  membersByAccount: Record<string, AccountMember[]>
  currentUserId: string | null
}> {
  if (!supabase) {
    return {
      accounts: [],
      transfers: [],
      memberLabels: {},
      membersByAccount: {},
      currentUserId: null,
    }
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()
  const currentUserId = session?.user?.id ?? null

  const [{ data: accountRows, error: accountError }, { data: transferRows, error: transferError }] =
    await Promise.all([
      supabase.from('accounts').select('*').order('created_at', { ascending: true }),
      supabase.from('transfers').select('*').order('occurred_on', { ascending: false }).limit(200),
    ])

  if (accountError) throw accountError
  if (transferError) throw transferError

  const client = supabase

  const accounts = (accountRows ?? []).map((row) => ({
    ...row,
    balance: Number(row.balance),
    hide_on_dashboard: Boolean(row.hide_on_dashboard),
    share_code: row.share_code == null ? null : String(row.share_code),
  })) as Account[]

  const transfers = (transferRows ?? []).map((row) => ({
    ...row,
    from_amount: Number(row.from_amount),
    to_amount: Number(row.to_amount),
    fx_rate: Number(row.fx_rate),
  })) as Transfer[]

  const memberLabels: Record<string, string> = {}
  const membersByAccount: Record<string, AccountMember[]> = {}

  await Promise.all(
    accounts.map(async (account) => {
      const { data, error } = await client.rpc('get_account_members', {
        p_account_id: account.id,
      })
      if (error) {
        membersByAccount[account.id] = []
        return
      }
      const members = (data ?? []) as AccountMember[]
      membersByAccount[account.id] = members
      for (const member of members) {
        memberLabels[member.user_id] = memberLabel(member, 'Member')
      }
    }),
  )

  return { accounts, transfers, memberLabels, membersByAccount, currentUserId }
}

const EMPTY_ACCOUNTS: Account[] = []
const EMPTY_TRANSFERS: Transfer[] = []
const EMPTY_LABELS: Record<string, string> = {}
const EMPTY_MEMBERS: Record<string, AccountMember[]> = {}

export function useAccounts() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.accounts.list,
    queryFn: fetchAccountsData,
    networkMode: 'offlineFirst',
  })

  const accounts = query.data?.accounts ?? EMPTY_ACCOUNTS
  const transfers = query.data?.transfers ?? EMPTY_TRANSFERS
  const memberLabels = query.data?.memberLabels ?? EMPTY_LABELS
  const membersByAccount = query.data?.membersByAccount ?? EMPTY_MEMBERS
  const currentUserId = query.data?.currentUserId ?? null

  async function invalidateAccounts() {
    await queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all })
  }

  const createAccount = useMutation({
    mutationFn: async (input: { name: string; currency: CurrencyCode; openingBalance: number }) => {
      if (!supabase) throw new Error('Supabase is not configured')
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const user = session?.user
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
      if (!supabase) throw new Error('Supabase is not configured')
      const account = accounts.find((item) => item.id === accountId)
      if (!account) throw new Error('Account not found')
      if (!(amount > 0)) throw new Error('Invalid amount')

      const {
        data: { session },
      } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) throw new Error('Not signed in')

      const { error: depositError } = await supabase.from('account_deposits').insert({
        account_id: accountId,
        user_id: user.id,
        amount,
        occurred_on: new Date().toISOString().slice(0, 10),
      })
      if (depositError) throw depositError

      await setBalance(accountId, account.balance + amount)
    },
    onSuccess: async () => {
      await Promise.all([
        invalidateAccounts(),
        queryClient.invalidateQueries({ queryKey: queryKeys.accounts.detailPrefix }),
      ])
    },
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
      const account = accounts.find((item) => item.id === accountId)
      if (account && currentUserId && account.user_id !== currentUserId) {
        throw new Error('NOT_CREATOR')
      }
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
        data: { session },
      } = await supabase.auth.getSession()
      const user = session?.user
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

  const setHideOnDashboard = useMutation({
    mutationFn: async ({ accountId, hide }: { accountId: string; hide: boolean }) => {
      if (!supabase) throw new Error('Supabase is not configured')
      const { error } = await supabase
        .from('accounts')
        .update({ hide_on_dashboard: hide })
        .eq('id', accountId)
      if (error) throw error
    },
    onSuccess: invalidateAccounts,
  })

  const enableSharing = useMutation({
    mutationFn: async (accountId: string) => {
      if (!supabase) throw new Error('Supabase is not configured')
      const code = generateShareCode()
      const { error } = await supabase
        .from('accounts')
        .update({ share_code: code })
        .eq('id', accountId)
      if (error) throw error
      return code
    },
    onSuccess: invalidateAccounts,
  })

  const regenerateShareCode = useMutation({
    mutationFn: async (accountId: string) => {
      if (!supabase) throw new Error('Supabase is not configured')
      const code = generateShareCode()
      const { error } = await supabase
        .from('accounts')
        .update({ share_code: code })
        .eq('id', accountId)
      if (error) throw error
      return code
    },
    onSuccess: invalidateAccounts,
  })

  const disableSharing = useMutation({
    mutationFn: async (accountId: string) => {
      if (!supabase) throw new Error('Supabase is not configured')
      const { error } = await supabase
        .from('accounts')
        .update({ share_code: null })
        .eq('id', accountId)
      if (error) throw error
    },
    onSuccess: invalidateAccounts,
  })

  const joinByShareCode = useMutation({
    mutationFn: async (code: string) => {
      if (!supabase) throw new Error('Supabase is not configured')
      const { data, error } = await supabase.rpc('join_account_by_share_code', {
        p_code: code.trim().toUpperCase(),
      })
      if (error) throw error
      return data as string
    },
    onSuccess: async () => {
      await Promise.all([
        invalidateAccounts(),
        queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all }),
      ])
    },
  })

  const leaveSharedAccount = useMutation({
    mutationFn: async (accountId: string) => {
      if (!supabase) throw new Error('Supabase is not configured')
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) throw new Error('Not signed in')
      const account = accounts.find((item) => item.id === accountId)
      if (account && account.user_id === user.id) throw new Error('CREATOR_CANNOT_LEAVE')
      const { error } = await supabase
        .from('account_members')
        .delete()
        .eq('account_id', accountId)
        .eq('user_id', user.id)
      if (error) throw error
    },
    onSuccess: async () => {
      await Promise.all([
        invalidateAccounts(),
        queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all }),
      ])
    },
  })

  const reload = async () => {
    await invalidateAccounts()
  }

  return {
    accounts,
    transfers,
    memberLabels,
    membersByAccount,
    currentUserId,
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
    setHideOnDashboard: (accountId: string, hide: boolean) =>
      setHideOnDashboard.mutateAsync({ accountId, hide }),
    transfer: (input: {
      fromAccountId: string
      toAccountId: string
      fromAmount: number
      toAmount: number
      occurredOn: string
      note: string
    }) => transfer.mutateAsync(input),
    enableSharing: (accountId: string) => enableSharing.mutateAsync(accountId),
    regenerateShareCode: (accountId: string) => regenerateShareCode.mutateAsync(accountId),
    disableSharing: (accountId: string) => disableSharing.mutateAsync(accountId),
    joinByShareCode: (code: string) => joinByShareCode.mutateAsync(code),
    leaveSharedAccount: (accountId: string) => leaveSharedAccount.mutateAsync(accountId),
  }
}
