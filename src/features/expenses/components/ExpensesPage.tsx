import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useAccounts } from '@/features/accounts'
import { ExpenseFormDialog } from '@/features/expenses/components/ExpenseFormDialog'
import { useExpenses, type Expense } from '@/features/expenses/hooks/useExpenses'
import { CATEGORY_COLORS } from '@/features/expenses/lib/categories'
import { useProfile } from '@/features/settings'
import { formatDate } from '@/shared/lib/format'
import { isSupabaseConfigured } from '@/shared/lib/supabase'
import { MoneyText } from '@/shared/ui/HideMoney'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { SetupNotice } from '@/shared/ui/SetupNotice'

export function ExpensesPage() {
  const { t, i18n } = useTranslation()
  const { profile } = useProfile()
  const { accounts, reload: reloadAccounts } = useAccounts()
  const { expenses, loading, error, createExpense, updateExpense, deleteExpense } = useExpenses()
  const [dialogExpense, setDialogExpense] = useState<Expense | null | 'new'>(null)
  const [deleteExpenseTarget, setDeleteExpenseTarget] = useState<Expense | null>(null)
  const lang = i18n.language
  const defaultCurrency = profile?.default_currency ?? 'USD'
  const dialogOpen = dialogExpense !== null

  return (
    <div className="space-y-4">
      {!isSupabaseConfigured ? <SetupNotice /> : null}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-heading">{t('app.navExpenses')}</h1>
        <Button
          type="button"
          className="rounded-xl"
          onClick={() => setDialogExpense('new')}
        >
          <Plus />
          {t('app.add')}
        </Button>
      </div>
      {accounts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gold-soft bg-surface p-6 text-muted">
          {t('accounts.needAccountFirst')}{' '}
          <Link to="/accounts" className="font-semibold underline">
            {t('app.navAccounts')}
          </Link>
        </p>
      ) : null}
      {loading ? <p>{t('app.loading')}</p> : null}
      {error ? <p className="text-red-600">{t('expense.error')}</p> : null}
      {!loading && expenses.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gold-soft bg-surface p-6 text-muted">
          {t('expense.empty')}
        </p>
      ) : null}
      <ul className="space-y-2">
        {expenses.map((item) => {
          const account = accounts.find((a) => a.id === item.account_id)
          return (
            <li key={item.id} className="flex items-start justify-between gap-3 rounded-2xl border border-gold-soft/70 bg-surface p-4 shadow-[0_12px_28px_rgba(201,162,39,0.08)]">
              <div>
                <p className="font-semibold">
                  <MoneyText amount={item.amount} lang={lang} currency={account?.currency} />
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
                  <span
                    className="inline-block size-2.5 rounded-full"
                    style={{ background: CATEGORY_COLORS[item.category] }}
                  />
                  {t(`categories.${item.category}`)}
                  {account ? (
                    <>
                      <span>·</span>
                      {account.name}
                    </>
                  ) : null}
                  <span>·</span>
                  {formatDate(item.occurred_on, lang)}
                </p>
                {item.note ? <p className="mt-1 text-sm text-muted">{item.note}</p> : null}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-10"
                  aria-label={t('app.edit')}
                  onClick={() => setDialogExpense(item)}
                >
                  <Pencil />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-10 text-red-700 hover:text-red-800"
                  aria-label={t('app.delete')}
                  onClick={() => setDeleteExpenseTarget(item)}
                >
                  <Trash2 />
                </Button>
              </div>
            </li>
          )
        })}
      </ul>

      <ConfirmDialog
        open={deleteExpenseTarget != null}
        description={t('expense.confirmDelete')}
        onOpenChange={(open) => {
          if (!open) setDeleteExpenseTarget(null)
        }}
        onConfirm={async () => {
          if (!deleteExpenseTarget) return
          await deleteExpense(deleteExpenseTarget.id)
          await reloadAccounts()
        }}
      />

      <ExpenseFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) setDialogExpense(null)
        }}
        expense={dialogExpense === 'new' ? null : dialogExpense}
        accounts={accounts}
        defaultCurrency={defaultCurrency}
        onSubmit={async (input) => {
          if (dialogExpense === 'new' || dialogExpense === null) await createExpense(input)
          else await updateExpense(dialogExpense.id, input)
          await reloadAccounts()
          setDialogExpense(null)
        }}
      />
    </div>
  )
}
