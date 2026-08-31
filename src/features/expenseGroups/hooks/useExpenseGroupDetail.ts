import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cachedExchangeRate, convertAmount } from '@/features/accounts/lib/exchangeRate'
import type { Expense } from '@/features/expenses/hooks/useExpenses'
import type { ExpenseGroup, ExpenseGroupMember } from '@/features/expenseGroups/hooks/useExpenseGroups'
import { queryKeys } from '@/shared/lib/queryKeys'
import { supabase } from '@/shared/lib/supabase'

export const SETTLEMENT_EPSILON = 0.05

export interface PersonPaidTotal {
  user_id: string
  label: string
  totalPaid: number
}

export interface PersonSettlementBalance {
  user_id: string
  label: string
  totalPaid: number
  /** Positive = group owes them; negative = they owe the group. */
  owedToThem: number
}

export interface GroupSettlement {
  id: string
  group_id: string
  from_user_id: string
  to_user_id: string
  amount: number
  account_id: string | null
  account_amount: number | null
  fx_rate: number | null
  occurred_on: string
  created_at: string
}

export type GroupExpense = Expense & { amount_group: number }

export interface ReceiveSettlementInput {
  groupId: string
  fromUserId: string
  amount: number
  accountId: string
  accountAmount: number
  fxRate: number
  occurredOn: string
}

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
    amount_group: row.amount_group == null ? null : Number(row.amount_group),
    group_fx_rate: row.group_fx_rate == null ? null : Number(row.group_fx_rate),
    account_currency: row.account_currency == null ? null : String(row.account_currency),
    account_id: String(row.account_id ?? ''),
    group_id: row.group_id == null ? null : String(row.group_id),
  }
}

function mapSettlement(row: Record<string, unknown>): GroupSettlement {
  return {
    id: String(row.id),
    group_id: String(row.group_id),
    from_user_id: String(row.from_user_id),
    to_user_id: String(row.to_user_id),
    amount: Number(row.amount),
    account_id: row.account_id == null ? null : String(row.account_id),
    account_amount: row.account_amount == null ? null : Number(row.account_amount),
    fx_rate: row.fx_rate == null ? null : Number(row.fx_rate),
    occurred_on: String(row.occurred_on),
    created_at: String(row.created_at),
  }
}

function emptyDetail(currentUserId: string | null = null) {
  return {
    group: null as ExpenseGroup | null,
    members: [] as ExpenseGroupMember[],
    expenses: [] as GroupExpense[],
    settlements: [] as GroupSettlement[],
    memberLabels: {} as Record<string, string>,
    personPaid: [] as PersonPaidTotal[],
    personBalances: [] as PersonSettlementBalance[],
    groupTotal: 0,
    fairShare: 0,
    fullySettled: true,
    currentUserId,
  }
}

async function fetchGroupDetail(groupId: string) {
  if (!supabase) return emptyDetail()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  const currentUserId = session?.user?.id ?? null

  const [
    { data: groupRow, error: groupError },
    { data: memberRows, error: memberError },
    { data: expenseRows, error: expenseError },
    { data: settlementRows, error: settlementError },
  ] = await Promise.all([
    supabase.from('expense_groups').select('*').eq('id', groupId).maybeSingle(),
    supabase.rpc('get_expense_group_members', { p_group_id: groupId }),
    supabase
      .from('expenses')
      .select('*')
      .eq('group_id', groupId)
      .order('occurred_on', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('group_settlements')
      .select('*')
      .eq('group_id', groupId)
      .order('occurred_on', { ascending: false })
      .order('created_at', { ascending: false }),
  ])

  if (groupError) throw groupError
  if (memberError) throw memberError
  if (expenseError) throw expenseError
  if (settlementError) throw settlementError

  if (!groupRow) return emptyDetail(currentUserId)

  const group: ExpenseGroup = {
    ...(groupRow as ExpenseGroup),
    archived: Boolean(groupRow.archived),
    settle_enabled: Boolean(groupRow.settle_enabled),
    share_code: groupRow.share_code == null ? null : String(groupRow.share_code),
  }

  const members = (memberRows ?? []) as ExpenseGroupMember[]
  const memberLabels: Record<string, string> = {}
  for (const member of members) {
    memberLabels[member.user_id] = memberLabel(member, 'Member')
  }

  const expenses = (expenseRows ?? []).map((row) => mapExpense(row as Record<string, unknown>))
  const settlements = (settlementRows ?? []).map((row) =>
    mapSettlement(row as Record<string, unknown>),
  )

  const currencyByAccount = new Map<string, string>()
  const { data: currencyRows } = await supabase.rpc('get_expense_group_account_currencies', {
    p_group_id: groupId,
  })
  for (const row of currencyRows ?? []) {
    currencyByAccount.set(
      String((row as { account_id: string }).account_id),
      String((row as { currency: string }).currency),
    )
  }

  const rateCache = new Map<string, number>()
  const groupExpenses: GroupExpense[] = []
  for (const expense of expenses) {
    const from = expense.account_currency ?? currencyByAccount.get(expense.account_id) ?? null
    if (expense.amount_group != null && (from == null || from === group.currency)) {
      groupExpenses.push({ ...expense, amount_group: expense.amount_group })
      continue
    }
    if (from == null || from === group.currency) {
      groupExpenses.push({
        ...expense,
        amount_group: expense.amount_group ?? expense.amount,
      })
      continue
    }
    const rate = await cachedExchangeRate(rateCache, from, group.currency, expense.occurred_on)
    groupExpenses.push({
      ...expense,
      amount_group:
        rate == null ? (expense.amount_group ?? expense.amount) : convertAmount(expense.amount, rate),
    })
  }

  const paidByUser: Record<string, number> = {}
  const receivedByUser: Record<string, number> = {}
  const sentByUser: Record<string, number> = {}
  for (const member of members) {
    paidByUser[member.user_id] = 0
    receivedByUser[member.user_id] = 0
    sentByUser[member.user_id] = 0
  }

  let groupTotal = 0
  for (const expense of groupExpenses) {
    groupTotal += expense.amount_group
    paidByUser[expense.user_id] = (paidByUser[expense.user_id] ?? 0) + expense.amount_group
    if (!memberLabels[expense.user_id]) {
      memberLabels[expense.user_id] = 'Member'
    }
  }

  for (const settlement of settlements) {
    receivedByUser[settlement.to_user_id] =
      (receivedByUser[settlement.to_user_id] ?? 0) + settlement.amount
    sentByUser[settlement.from_user_id] =
      (sentByUser[settlement.from_user_id] ?? 0) + settlement.amount
    if (!memberLabels[settlement.to_user_id]) memberLabels[settlement.to_user_id] = 'Member'
    if (!memberLabels[settlement.from_user_id]) memberLabels[settlement.from_user_id] = 'Member'
  }

  const memberCount = Math.max(members.length, 1)
  const fairShare = memberCount > 0 ? groupTotal / memberCount : 0

  const personPaid: PersonPaidTotal[] = Object.keys(paidByUser).map((userId) => ({
    user_id: userId,
    label: memberLabels[userId] ?? 'Member',
    totalPaid: paidByUser[userId] ?? 0,
  }))
  personPaid.sort((a, b) => b.totalPaid - a.totalPaid)

  const personBalances: PersonSettlementBalance[] = members.map((member) => {
    const paid = paidByUser[member.user_id] ?? 0
    const received = receivedByUser[member.user_id] ?? 0
    const sent = sentByUser[member.user_id] ?? 0
    return {
      user_id: member.user_id,
      label: memberLabels[member.user_id] ?? 'Member',
      totalPaid: paid,
      owedToThem: paid - fairShare - received + sent,
    }
  })
  personBalances.sort((a, b) => b.owedToThem - a.owedToThem)

  const fullySettled =
    personBalances.length === 0 ||
    personBalances.every((row) => Math.abs(row.owedToThem) < SETTLEMENT_EPSILON)

  return {
    group,
    members,
    expenses: groupExpenses,
    settlements,
    memberLabels,
    personPaid,
    personBalances,
    groupTotal,
    fairShare,
    fullySettled,
    currentUserId,
  }
}

export function useExpenseGroupDetail(groupId: string | null) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: groupId
      ? queryKeys.expenseGroups.detail(groupId)
      : (['expenseGroups', 'detail', 'none'] as const),
    queryFn: () => fetchGroupDetail(groupId!),
    enabled: Boolean(groupId),
    networkMode: 'offlineFirst',
  })

  async function invalidateDetail() {
    if (!groupId) return
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.expenseGroups.detail(groupId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.expenseGroups.list }),
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all }),
    ])
  }

  const receiveSettlement = useMutation({
    mutationFn: async (input: ReceiveSettlementInput) => {
      if (!supabase) throw new Error('Supabase is not configured')
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) throw new Error('Not signed in')
      if (input.fromUserId === user.id) throw new Error('Invalid payer')
      if (!(input.amount > 0) || !(input.accountAmount > 0)) throw new Error('Invalid amount')

      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select('id, balance')
        .eq('id', input.accountId)
        .single()
      if (accountError || !account) throw accountError ?? new Error('Account not found')

      const { error: settlementError } = await supabase.from('group_settlements').insert({
        group_id: input.groupId,
        from_user_id: input.fromUserId,
        to_user_id: user.id,
        amount: input.amount,
        account_id: input.accountId,
        account_amount: input.accountAmount,
        fx_rate: input.fxRate,
        occurred_on: input.occurredOn,
      })
      if (settlementError) throw settlementError

      const { error: depositError } = await supabase.from('account_deposits').insert({
        account_id: input.accountId,
        user_id: user.id,
        amount: input.accountAmount,
        occurred_on: input.occurredOn,
      })
      if (depositError) throw depositError

      const { error: balanceError } = await supabase
        .from('accounts')
        .update({ balance: Number(account.balance) + input.accountAmount })
        .eq('id', input.accountId)
      if (balanceError) throw balanceError
    },
    onSuccess: invalidateDetail,
  })

  return {
    group: query.data?.group ?? null,
    members: query.data?.members ?? [],
    expenses: query.data?.expenses ?? [],
    settlements: query.data?.settlements ?? [],
    memberLabels: query.data?.memberLabels ?? {},
    personPaid: query.data?.personPaid ?? [],
    personBalances: query.data?.personBalances ?? [],
    groupTotal: query.data?.groupTotal ?? 0,
    fairShare: query.data?.fairShare ?? 0,
    fullySettled: query.data?.fullySettled ?? true,
    currentUserId: query.data?.currentUserId ?? null,
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    reload: () => query.refetch(),
    receiveSettlement: (input: ReceiveSettlementInput) => receiveSettlement.mutateAsync(input),
  }
}
