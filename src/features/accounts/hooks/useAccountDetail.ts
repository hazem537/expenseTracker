import { useQuery } from '@tanstack/react-query'
import type { Expense } from '@/features/expenses/hooks/useExpenses'
import type { Account, AccountMember } from '@/features/accounts/hooks/useAccounts'
import { queryKeys } from '@/shared/lib/queryKeys'
import { supabase } from '@/shared/lib/supabase'

export interface AccountDeposit {
  id: string
  account_id: string
  user_id: string
  amount: number
  occurred_on: string
  note: string | null
  created_at: string
}

export interface MemberTotals {
  user_id: string
  label: string
  totalIn: number
  totalOut: number
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

function memberLabel(row: AccountMember, fallback: string) {
  const name = row.display_name?.trim()
  if (name) return name
  if (row.email) return row.email
  return fallback
}

async function fetchAccountDetail(accountId: string) {
  if (!supabase) {
    return {
      account: null as Account | null,
      expenses: [] as Expense[],
      deposits: [] as AccountDeposit[],
      members: [] as AccountMember[],
      memberTotals: [] as MemberTotals[],
      memberLabels: {} as Record<string, string>,
      currentUserId: null as string | null,
    }
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()
  const currentUserId = session?.user?.id ?? null
  const client = supabase

  const [
    { data: accountRow, error: accountError },
    { data: expenseRows, error: expenseError },
    { data: depositRows, error: depositError },
    { data: memberRows, error: memberError },
  ] = await Promise.all([
    client.from('accounts').select('*').eq('id', accountId).maybeSingle(),
    client
      .from('expenses')
      .select('*')
      .eq('account_id', accountId)
      .order('occurred_on', { ascending: false })
      .order('created_at', { ascending: false }),
    client
      .from('account_deposits')
      .select('*')
      .eq('account_id', accountId)
      .order('occurred_on', { ascending: false })
      .order('created_at', { ascending: false }),
    client.rpc('get_account_members', { p_account_id: accountId }),
  ])

  if (accountError) throw accountError
  if (expenseError) throw expenseError
  if (memberError) {
    /* members RPC optional until schema applied */
  }
  if (!accountRow) {
    return {
      account: null,
      expenses: [],
      deposits: [],
      members: [],
      memberTotals: [],
      memberLabels: {},
      currentUserId,
    }
  }

  const account: Account = {
    ...(accountRow as Account),
    balance: Number(accountRow.balance),
    share_code: accountRow.share_code == null ? null : String(accountRow.share_code),
  }

  const expenses = (expenseRows ?? []).map((row) => mapExpense(row as Record<string, unknown>))
  const deposits = depositError
    ? []
    : ((depositRows ?? []).map((row) => ({
        id: String(row.id),
        account_id: String(row.account_id),
        user_id: String(row.user_id),
        amount: Number(row.amount),
        occurred_on: String(row.occurred_on),
        note: row.note == null ? null : String(row.note),
        created_at: String(row.created_at),
      })) as AccountDeposit[])

  const members = (memberRows ?? []) as AccountMember[]
  const memberLabels: Record<string, string> = {}
  for (const member of members) {
    memberLabels[member.user_id] = memberLabel(member, 'Member')
  }

  const totalsMap = new Map<string, MemberTotals>()
  for (const member of members) {
    totalsMap.set(member.user_id, {
      user_id: member.user_id,
      label: memberLabels[member.user_id],
      totalIn: 0,
      totalOut: 0,
    })
  }

  for (const expense of expenses) {
    const row = totalsMap.get(expense.user_id) ?? {
      user_id: expense.user_id,
      label: memberLabels[expense.user_id] ?? 'Member',
      totalIn: 0,
      totalOut: 0,
    }
    row.totalOut += expense.amount
    totalsMap.set(expense.user_id, row)
  }

  for (const deposit of deposits) {
    const row = totalsMap.get(deposit.user_id) ?? {
      user_id: deposit.user_id,
      label: memberLabels[deposit.user_id] ?? 'Member',
      totalIn: 0,
      totalOut: 0,
    }
    row.totalIn += deposit.amount
    totalsMap.set(deposit.user_id, row)
  }

  return {
    account,
    expenses,
    deposits,
    members,
    memberTotals: Array.from(totalsMap.values()).sort((a, b) => a.label.localeCompare(b.label)),
    memberLabels,
    currentUserId,
  }
}

export function useAccountDetail(accountId: string | undefined) {
  const query = useQuery({
    queryKey: queryKeys.accounts.detail(accountId ?? ''),
    queryFn: () => fetchAccountDetail(accountId!),
    enabled: Boolean(accountId),
    networkMode: 'offlineFirst',
  })

  return {
    account: query.data?.account ?? null,
    expenses: query.data?.expenses ?? [],
    deposits: query.data?.deposits ?? [],
    members: query.data?.members ?? [],
    memberTotals: query.data?.memberTotals ?? [],
    memberLabels: query.data?.memberLabels ?? {},
    currentUserId: query.data?.currentUserId ?? null,
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    reload: () => query.refetch(),
  }
}
