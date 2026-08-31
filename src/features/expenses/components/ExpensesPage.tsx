import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useAccounts } from '@/features/accounts'
import { useExpenseGroups } from '@/features/expenseGroups'
import { ExpenseFormDialog } from '@/features/expenses/components/ExpenseFormDialog'
import { useExpenses, type Expense } from '@/features/expenses/hooks/useExpenses'
import { expensesOnMyAccounts, useExpensesInCurrency } from '@/features/expenses/lib/displayCurrency'
import { CATEGORIES, CATEGORY_COLORS, type Category } from '@/features/expenses/lib/categories'
import { useProfile } from '@/features/settings'
import { DEFAULT_CURRENCY } from '@/shared/lib/currencies'
import { formatDate } from '@/shared/lib/format'
import { useOnlineStatus } from '@/shared/lib/online'
import { isSupabaseConfigured } from '@/shared/lib/supabase'
import { MoneyText } from '@/shared/ui/HideMoney'
import { ExpandableRecord } from '@/shared/ui/ExpandableRecord'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { SetupNotice } from '@/shared/ui/SetupNotice'

type GroupFilter = '' | 'none' | string

export function ExpensesPage({ hideTitle = false }: { hideTitle?: boolean }) {
  const { t, i18n } = useTranslation()
  const online = useOnlineStatus()
  const { profile } = useProfile()
  const { accounts, memberLabels, currentUserId } = useAccounts()
  const { groups } = useExpenseGroups()
  const { expenses, loading, error, createExpense, updateExpense, deleteExpense } = useExpenses()
  const [dialogExpense, setDialogExpense] = useState<Expense | null | 'new'>(null)
  const [deleteExpenseTarget, setDeleteExpenseTarget] = useState<Expense | null>(null)
  const [filterAccountId, setFilterAccountId] = useState('')
  const [filterCategory, setFilterCategory] = useState<'' | Category>('')
  const [filterGroupId, setFilterGroupId] = useState<GroupFilter>('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const lang = i18n.language
  const defaultCurrency = profile?.default_currency ?? DEFAULT_CURRENCY
  const dialogOpen = dialogExpense !== null

  const groupNameById = useMemo(() => {
    const map: Record<string, string> = {}
    for (const group of groups) map[group.id] = group.name
    return map
  }, [groups])

  const myExpenses = useMemo(() => expensesOnMyAccounts(expenses, accounts), [expenses, accounts])

  const filteredExpenses = useMemo(() => {
    return myExpenses.filter((item) => {
      if (filterAccountId && item.account_id !== filterAccountId) return false
      if (filterCategory && item.category !== filterCategory) return false
      if (filterGroupId === 'none') {
        if (item.group_id) return false
      } else if (filterGroupId) {
        if (item.group_id !== filterGroupId) return false
      }
      return true
    })
  }, [myExpenses, filterAccountId, filterCategory, filterGroupId])

  const showNeedCache = !online && !loading && myExpenses.length === 0 && !error
  const filtersActive = Boolean(filterAccountId || filterCategory || filterGroupId)

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === filterAccountId) ?? null,
    [accounts, filterAccountId],
  )
  const displayCurrency = selectedAccount?.currency ?? defaultCurrency

  const convertedFilteredExpenses = useExpensesInCurrency(
    filteredExpenses,
    accounts,
    displayCurrency,
    online,
  )

  const filteredTotal = useMemo(
    () =>
      convertedFilteredExpenses.reduce((sum, item) => sum + item.amount_base, 0),
    [convertedFilteredExpenses],
  )

  function clearFilters() {
    setFilterAccountId('')
    setFilterCategory('')
    setFilterGroupId('')
  }

  return (
    <div className="space-y-4">
      {!isSupabaseConfigured ? <SetupNotice /> : null}
      <div className="flex items-center justify-between gap-3">
        {hideTitle ? <div /> : <h1 className="text-xl font-bold text-heading sm:text-2xl">{t('expense.tabExpenses')}</h1>}
        <Button
          type="button"
          className="h-11 shrink-0 rounded-xl"
          onClick={() => setDialogExpense('new')}
          disabled={accounts.length === 0}
        >
          <Plus />
          <span className="ms-1">{t('app.add')}</span>
        </Button>
      </div>
      {accounts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gold-soft bg-surface p-4 text-sm text-muted sm:p-6">
          {t('accounts.needAccountFirst')}{' '}
          <Link to="/accounts" className="font-semibold underline">
            {t('app.navAccounts')}
          </Link>
        </p>
      ) : null}

      {accounts.length > 0 ? (
        <div className="grid gap-3 rounded-2xl border border-gold-soft/70 bg-surface p-3 shadow-[0_12px_28px_rgba(201,162,39,0.08)] sm:grid-cols-2 sm:p-4 lg:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-muted" htmlFor="filter-account">
              {t('expense.filterAccount')}
            </label>
            <select
              id="filter-account"
              className="mt-1 min-h-11 w-full rounded-xl border border-gold-soft bg-surface px-3 text-sm"
              value={filterAccountId}
              onChange={(e) => setFilterAccountId(e.target.value)}
            >
              <option value="">{t('expense.filterAllAccounts')}</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted" htmlFor="filter-category">
              {t('expense.filterCategory')}
            </label>
            <select
              id="filter-category"
              className="mt-1 min-h-11 w-full rounded-xl border border-gold-soft bg-surface px-3 text-sm"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as '' | Category)}
            >
              <option value="">{t('expense.filterAllCategories')}</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {t(`categories.${category}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-xs font-medium text-muted" htmlFor="filter-group">
              {t('expense.filterGroup')}
            </label>
            <select
              id="filter-group"
              className="mt-1 min-h-11 w-full rounded-xl border border-gold-soft bg-surface px-3 text-sm"
              value={filterGroupId}
              onChange={(e) => setFilterGroupId(e.target.value as GroupFilter)}
            >
              <option value="">{t('expense.filterAllGroups')}</option>
              <option value="none">{t('expense.filterNoGroup')}</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.archived ? t('expense.groupArchived', { name: group.name }) : group.name}
                </option>
              ))}
            </select>
          </div>
          {filtersActive ? (
            <button
              type="button"
              className="text-sm font-medium text-heading underline sm:col-span-2 lg:col-span-3"
              onClick={clearFilters}
            >
              {t('expense.clearFilters')}
            </button>
          ) : null}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted" role="status">
          {t('app.loading')}
        </p>
      ) : null}
      {error && online ? (
        <p
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
          role="alert"
        >
          {t('expense.error')}
        </p>
      ) : null}
      {showNeedCache ? (
        <p className="rounded-2xl border border-dashed border-gold-soft bg-surface p-4 text-sm text-muted sm:p-6">
          {t('offline.needCache')}
        </p>
      ) : null}
      {!loading && !showNeedCache && myExpenses.length === 0 && !error ? (
        <p className="rounded-2xl border border-dashed border-gold-soft bg-surface p-4 text-sm text-muted sm:p-6">
          {t('expense.empty')}
        </p>
      ) : null}
      {!loading && myExpenses.length > 0 && filteredExpenses.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gold-soft bg-surface p-4 text-sm text-muted sm:p-6">
          {t('expense.filterEmpty')}
        </p>
      ) : null}
      {!loading && filteredExpenses.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold-soft/70 bg-surface p-4 shadow-[0_12px_28px_rgba(201,162,39,0.08)]">
          <div>
            <p className="text-xs font-medium text-muted">
              {filtersActive ? t('expense.filteredTotal') : t('expense.totalSpent')}
            </p>
            <p className="text-xl font-bold text-heading sm:text-2xl">
              <MoneyText amount={filteredTotal} lang={lang} currency={displayCurrency} />
            </p>
          </div>
          <div className="text-end">
            <p className="text-xs font-medium text-muted">{t('expense.count')}</p>
            <p className="text-lg font-bold text-heading sm:text-xl">
              {filteredExpenses.length}
            </p>
          </div>
        </div>
      ) : null}

      {!loading && filteredExpenses.length > 0 ? (
        <ul className="space-y-2">
          {filteredExpenses.map((item) => {
            const account = accounts.find((a) => a.id === item.account_id)
            const groupName = item.group_id ? groupNameById[item.group_id] : null
            const canMutate = online && !item.pending
            return (
              <ExpandableRecord
                key={item.id}
                expanded={expandedId === item.id}
                onToggle={() => setExpandedId((id) => (id === item.id ? null : item.id))}
                summary={
                  <p className="flex min-w-0 items-center gap-2 truncate text-sm text-muted">
                    <span
                      className="inline-block size-2.5 shrink-0 rounded-full"
                      style={{ background: CATEGORY_COLORS[item.category] }}
                      aria-hidden
                    />
                    <span className="truncate font-medium text-heading">{t(`categories.${item.category}`)}</span>
                    <span aria-hidden>·</span>
                    <span className="shrink-0">{formatDate(item.occurred_on, lang)}</span>
                  </p>
                }
                value={
                  <p className="font-semibold">
                    <MoneyText amount={item.amount} lang={lang} currency={account?.currency} />
                    {item.pending ? (
                      <span className="ms-1 block text-[10px] font-medium text-amber-700 dark:text-amber-300">
                        {t('offline.pendingBadge')}
                      </span>
                    ) : null}
                  </p>
                }
              >
                {account ? <p className="text-sm text-muted">{account.name}</p> : null}
                {account &&
                (Boolean(account.share_code) ||
                  account.user_id !== item.user_id ||
                  (currentUserId != null && item.user_id !== currentUserId)) ? (
                  <p className="text-sm text-muted">
                    {t('expense.addedBy', {
                      name:
                        memberLabels[item.user_id] ??
                        (item.user_id === currentUserId
                          ? t('accounts.you')
                          : t('accounts.memberFallback')),
                    })}
                  </p>
                ) : null}
                {groupName || item.group_id ? (
                  <p>
                    <span className="inline-flex max-w-full items-center rounded-full bg-navy/10 px-2 py-0.5 text-xs font-medium text-heading dark:bg-gold/20">
                      <span className="truncate">
                        {t('expense.inGroup', {
                          name: groupName ?? t('expense.unknownGroup'),
                        })}
                      </span>
                    </span>
                  </p>
                ) : null}
                {item.note ? <p className="text-sm text-muted">{item.note}</p> : null}
                <div className="flex justify-end gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-10"
                    aria-label={canMutate ? t('app.edit') : t('offline.actionDisabled')}
                    disabled={!canMutate}
                    title={!canMutate ? t('offline.actionDisabled') : undefined}
                    onClick={() => setDialogExpense(item)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-10 text-red-700 hover:text-red-800"
                    aria-label={canMutate ? t('app.delete') : t('offline.actionDisabled')}
                    disabled={!canMutate}
                    title={!canMutate ? t('offline.actionDisabled') : undefined}
                    onClick={() => setDeleteExpenseTarget(item)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </ExpandableRecord>
            )
          })}
        </ul>
      ) : null}

      <ConfirmDialog
        open={deleteExpenseTarget != null}
        description={t('expense.confirmDelete')}
        onOpenChange={(open) => {
          if (!open) setDeleteExpenseTarget(null)
        }}
        onConfirm={async () => {
          if (!deleteExpenseTarget) return
          await deleteExpense(deleteExpenseTarget.id)
        }}
      />

      <ExpenseFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) setDialogExpense(null)
        }}
        expense={dialogExpense === 'new' ? null : dialogExpense}
        accounts={accounts}
        groups={groups}
        defaultCurrency={defaultCurrency}
        onSubmit={async (input) => {
          if (dialogExpense === 'new' || dialogExpense === null) await createExpense(input)
          else await updateExpense(dialogExpense.id, input)
        }}
      />
    </div>
  )
}
