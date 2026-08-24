import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CurrencyCode } from '@/shared/lib/currencies'
import { queryKeys } from '@/shared/lib/queryKeys'
import { supabase } from '@/shared/lib/supabase'

export interface ExpenseGroup {
  id: string
  user_id: string
  name: string
  currency: CurrencyCode
  share_code: string | null
  archived: boolean
  created_at: string
}

export interface ExpenseGroupMember {
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

function memberLabel(row: ExpenseGroupMember, fallback: string) {
  const name = row.display_name?.trim()
  if (name) return name
  if (row.email) return row.email
  return fallback
}

async function fetchExpenseGroupsData(): Promise<{
  groups: ExpenseGroup[]
  memberLabels: Record<string, string>
  membersByGroup: Record<string, ExpenseGroupMember[]>
  currentUserId: string | null
}> {
  if (!supabase) {
    return {
      groups: [],
      memberLabels: {},
      membersByGroup: {},
      currentUserId: null,
    }
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()
  const currentUserId = session?.user?.id ?? null

  const { data: groupRows, error: groupError } = await supabase
    .from('expense_groups')
    .select('*')
    .order('created_at', { ascending: false })

  if (groupError) throw groupError

  const client = supabase
  const groups = (groupRows ?? []).map((row) => ({
    ...row,
    archived: Boolean(row.archived),
    share_code: row.share_code == null ? null : String(row.share_code),
  })) as ExpenseGroup[]

  const memberLabels: Record<string, string> = {}
  const membersByGroup: Record<string, ExpenseGroupMember[]> = {}

  await Promise.all(
    groups.map(async (group) => {
      const { data, error } = await client.rpc('get_expense_group_members', {
        p_group_id: group.id,
      })
      if (error) {
        membersByGroup[group.id] = []
        return
      }
      const members = (data ?? []) as ExpenseGroupMember[]
      membersByGroup[group.id] = members
      for (const member of members) {
        memberLabels[member.user_id] = memberLabel(member, 'Member')
      }
    }),
  )

  return { groups, memberLabels, membersByGroup, currentUserId }
}

export function useExpenseGroups() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.expenseGroups.list,
    queryFn: fetchExpenseGroupsData,
    networkMode: 'offlineFirst',
  })

  const groups = query.data?.groups ?? []
  const memberLabels = query.data?.memberLabels ?? {}
  const membersByGroup = query.data?.membersByGroup ?? {}
  const currentUserId = query.data?.currentUserId ?? null

  async function invalidateGroups() {
    await queryClient.invalidateQueries({ queryKey: queryKeys.expenseGroups.all })
  }

  const createGroup = useMutation({
    mutationFn: async (input: { name: string; currency: CurrencyCode }) => {
      if (!supabase) throw new Error('Supabase is not configured')
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) throw new Error('Not signed in')
      const { error } = await supabase.from('expense_groups').insert({
        user_id: user.id,
        name: input.name.trim(),
        currency: input.currency,
      })
      if (error) throw error
    },
    onSuccess: invalidateGroups,
  })

  const enableSharing = useMutation({
    mutationFn: async (groupId: string) => {
      if (!supabase) throw new Error('Supabase is not configured')
      const code = generateShareCode()
      const { error } = await supabase
        .from('expense_groups')
        .update({ share_code: code })
        .eq('id', groupId)
      if (error) throw error
      return code
    },
    onSuccess: invalidateGroups,
  })

  const regenerateShareCode = useMutation({
    mutationFn: async (groupId: string) => {
      if (!supabase) throw new Error('Supabase is not configured')
      const code = generateShareCode()
      const { error } = await supabase
        .from('expense_groups')
        .update({ share_code: code })
        .eq('id', groupId)
      if (error) throw error
      return code
    },
    onSuccess: invalidateGroups,
  })

  const disableSharing = useMutation({
    mutationFn: async (groupId: string) => {
      if (!supabase) throw new Error('Supabase is not configured')
      const { error } = await supabase
        .from('expense_groups')
        .update({ share_code: null })
        .eq('id', groupId)
      if (error) throw error
    },
    onSuccess: invalidateGroups,
  })

  const joinByShareCode = useMutation({
    mutationFn: async (code: string) => {
      if (!supabase) throw new Error('Supabase is not configured')
      const { data, error } = await supabase.rpc('join_expense_group_by_share_code', {
        p_code: code.trim().toUpperCase(),
      })
      if (error) throw error
      return data as string
    },
    onSuccess: invalidateGroups,
  })

  const setArchived = useMutation({
    mutationFn: async ({ groupId, archived }: { groupId: string; archived: boolean }) => {
      if (!supabase) throw new Error('Supabase is not configured')
      const { error } = await supabase
        .from('expense_groups')
        .update({ archived })
        .eq('id', groupId)
      if (error) throw error
    },
    onSuccess: invalidateGroups,
  })

  const leaveGroup = useMutation({
    mutationFn: async (groupId: string) => {
      if (!supabase) throw new Error('Supabase is not configured')
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) throw new Error('Not signed in')
      const group = groups.find((item) => item.id === groupId)
      if (group && group.user_id === user.id) throw new Error('CREATOR_CANNOT_LEAVE')
      const { error } = await supabase
        .from('expense_group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id)
      if (error) throw error
    },
    onSuccess: invalidateGroups,
  })

  const deleteGroup = useMutation({
    mutationFn: async (groupId: string) => {
      if (!supabase) throw new Error('Supabase is not configured')
      const group = groups.find((item) => item.id === groupId)
      if (group && currentUserId && group.user_id !== currentUserId) {
        throw new Error('NOT_CREATOR')
      }
      const { error } = await supabase.from('expense_groups').delete().eq('id', groupId)
      if (error) throw error
    },
    onSuccess: async () => {
      await Promise.all([
        invalidateGroups(),
        queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all }),
      ])
    },
  })

  return {
    groups,
    memberLabels,
    membersByGroup,
    currentUserId,
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    reload: invalidateGroups,
    createGroup: (input: { name: string; currency: CurrencyCode }) => createGroup.mutateAsync(input),
    enableSharing: (groupId: string) => enableSharing.mutateAsync(groupId),
    regenerateShareCode: (groupId: string) => regenerateShareCode.mutateAsync(groupId),
    disableSharing: (groupId: string) => disableSharing.mutateAsync(groupId),
    joinByShareCode: (code: string) => joinByShareCode.mutateAsync(code),
    leaveGroup: (groupId: string) => leaveGroup.mutateAsync(groupId),
    setArchived: (groupId: string, archived: boolean) =>
      setArchived.mutateAsync({ groupId, archived }),
    deleteGroup: (groupId: string) => deleteGroup.mutateAsync(groupId),
  }
}
