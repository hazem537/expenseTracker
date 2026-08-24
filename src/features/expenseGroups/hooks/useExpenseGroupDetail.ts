import { useQuery } from '@tanstack/react-query'
import { convertAmount, fetchExchangeRate } from '@/features/accounts/lib/exchangeRate'
import type { Expense } from '@/features/expenses/hooks/useExpenses'
import type { ExpenseGroup, ExpenseGroupMember } from '@/features/expenseGroups/hooks/useExpenseGroups'
import { queryKeys } from '@/shared/lib/queryKeys'
import { supabase } from '@/shared/lib/supabase'

export interface PersonPaidTotal {
  user_id: string
  label: string
  totalPaid: number
}

export type GroupExpense = Expense & { amount_group: number }

function memberLabel(row: ExpenseGroupMember, fallback: string) {
  const name = row.display_name?.trim()
  if (name) return name
  if (row.email) return row.email
  return fallback
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
    group_id: row.group_id == null ? null : String(row.group_id),
  }
}

async function fetchRates(fromCurrencies: string[], target: string) {
  const cache = new Map<string, number>()
  const unique = [...new Set(fromCurrencies.filter(Boolean))]
  await Promise.all(
    unique.map(async (from) => {
      if (from === target) {
        cache.set(from, 1)
        return
      }
      try {
        cache.set(from, await fetchExchangeRate(from, target))
      } catch {
        cache.set(from, 1)
      }
    }),
  )
  return cache
}

async function fetchGroupDetail(groupId: string): Promise<{
  group: ExpenseGroup | null
  members: ExpenseGroupMember[]
  expenses: GroupExpense[]
  memberLabels: Record<string, string>
  personPaid: PersonPaidTotal[]
  groupTotal: number
  currentUserId: string | null
}> {
  if (!supabase) {
    return {
      group: null,
      members: [],
      expenses: [],
      memberLabels: {},
      personPaid: [],
      groupTotal: 0,
      currentUserId: null,
    }
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()
  const currentUserId = session?.user?.id ?? null

  const [{ data: groupRow, error: groupError }, { data: memberRows, error: memberError }, { data: expenseRows, error: expenseError }] =
    await Promise.all([
      supabase.from('expense_groups').select('*').eq('id', groupId).maybeSingle(),
      supabase.rpc('get_expense_group_members', { p_group_id: groupId }),
      supabase
        .from('expenses')
        .select('*')
        .eq('group_id', groupId)
        .order('occurred_on', { ascending: false })
        .order('created_at', { ascending: false }),
    ])

  if (groupError) throw groupError
  if (memberError) throw memberError
  if (expenseError) throw expenseError

  if (!groupRow) {
    return {
      group: null,
      members: [],
      expenses: [],
      memberLabels: {},
      personPaid: [],
      groupTotal: 0,
      currentUserId,
    }
  }

  const group: ExpenseGroup = {
    ...(groupRow as ExpenseGroup),
    share_code: groupRow.share_code == null ? null : String(groupRow.share_code),
  }

  const members = (memberRows ?? []) as ExpenseGroupMember[]
  const memberLabels: Record<string, string> = {}
  for (const member of members) {
    memberLabels[member.user_id] = memberLabel(member, 'Member')
  }

  const expenses = (expenseRows ?? []).map((row) => mapExpense(row as Record<string, unknown>))
  const accountIds = [...new Set(expenses.map((item) => item.account_id).filter(Boolean))]
  const currencyByAccount = new Map<string, string>()
  if (accountIds.length > 0) {
    const { data: accountRows } = await supabase.from('accounts').select('id, currency').in('id', accountIds)
    for (const row of accountRows ?? []) {
      currencyByAccount.set(String(row.id), String(row.currency))
    }
  }

  const sourceCurrencies = expenses.map(
    (item) => currencyByAccount.get(item.account_id) ?? group.currency,
  )
  const rates = await fetchRates(sourceCurrencies, group.currency)

  const groupExpenses: GroupExpense[] = expenses.map((expense) => {
    const from = currencyByAccount.get(expense.account_id) ?? group.currency
    const rate = rates.get(from) ?? 1
    return { ...expense, amount_group: convertAmount(expense.amount, rate) }
  })

  const paidByUser: Record<string, number> = {}
  for (const member of members) {
    paidByUser[member.user_id] = 0
  }
  let groupTotal = 0
  for (const expense of groupExpenses) {
    groupTotal += expense.amount_group
    paidByUser[expense.user_id] = (paidByUser[expense.user_id] ?? 0) + expense.amount_group
    if (!memberLabels[expense.user_id]) {
      memberLabels[expense.user_id] = 'Member'
    }
  }

  const personPaid: PersonPaidTotal[] = Object.keys(paidByUser).map((userId) => ({
    user_id: userId,
    label: memberLabels[userId] ?? 'Member',
    totalPaid: paidByUser[userId] ?? 0,
  }))
  personPaid.sort((a, b) => b.totalPaid - a.totalPaid)

  return {
    group,
    members,
    expenses: groupExpenses,
    memberLabels,
    personPaid,
    groupTotal,
    currentUserId,
  }
}

export function useExpenseGroupDetail(groupId: string | null) {
  const query = useQuery({
    queryKey: groupId
      ? queryKeys.expenseGroups.detail(groupId)
      : (['expenseGroups', 'detail', 'none'] as const),
    queryFn: () => fetchGroupDetail(groupId!),
    enabled: Boolean(groupId),
    networkMode: 'offlineFirst',
  })

  return {
    group: query.data?.group ?? null,
    members: query.data?.members ?? [],
    expenses: query.data?.expenses ?? [],
    memberLabels: query.data?.memberLabels ?? {},
    personPaid: query.data?.personPaid ?? [],
    groupTotal: query.data?.groupTotal ?? 0,
    currentUserId: query.data?.currentUserId ?? null,
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    reload: () => query.refetch(),
  }
}
