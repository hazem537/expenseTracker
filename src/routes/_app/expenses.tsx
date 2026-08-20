import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ExpenseForm } from '../../components/ExpenseForm'
import { SetupNotice } from '../../components/SetupNotice'
import { useExpenses, type Expense } from '../../hooks/useExpenses'
import { formatAmount, formatDate } from '../../lib/format'
import { CATEGORY_COLORS } from '../../lib/categories'
import { isSupabaseConfigured } from '../../lib/supabase'

export const Route = createFileRoute('/_app/expenses')({
  component: ExpensesPage,
})

function ExpensesPage() {
  const { t, i18n } = useTranslation()
  const { expenses, loading, error, createExpense, updateExpense, deleteExpense } = useExpenses()
  const [editing, setEditing] = useState<Expense | null | 'new'>(null)
  const lang = i18n.language

  return (
    <div className="space-y-4">
      {!isSupabaseConfigured ? <SetupNotice /> : null}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t('app.navExpenses')}</h1>
        <button
          type="button"
          className="min-h-12 rounded-xl bg-slate-900 px-4 font-semibold text-white"
          onClick={() => setEditing('new')}
        >
          {t('app.add')}
        </button>
      </div>
      {loading ? <p>{t('app.loading')}</p> : null}
      {error ? <p className="text-red-600">{t('expense.error')}</p> : null}
      {editing ? (
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <ExpenseForm
            initial={editing === 'new' ? null : editing}
            onCancel={() => setEditing(null)}
            onSubmit={async (input) => {
              if (editing === 'new') await createExpense(input)
              else await updateExpense(editing.id, input)
              setEditing(null)
            }}
          />
        </div>
      ) : null}
      {!loading && expenses.length === 0 && editing !== 'new' ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-slate-500">
          {t('expense.empty')}
        </p>
      ) : null}
      <ul className="space-y-2">
        {expenses.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
            <div>
              <p className="font-semibold">{formatAmount(item.amount, lang)}</p>
              <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                <span
                  className="inline-block size-2.5 rounded-full"
                  style={{ background: CATEGORY_COLORS[item.category] }}
                />
                {t(`categories.${item.category}`)}
                <span>·</span>
                {formatDate(item.occurred_on, lang)}
              </p>
              {item.note ? <p className="mt-1 text-sm text-slate-500">{item.note}</p> : null}
            </div>
            <div className="flex shrink-0 flex-col gap-1">
              <button
                type="button"
                className="min-h-10 rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
                onClick={() => setEditing(item)}
              >
                {t('app.edit')}
              </button>
              <button
                type="button"
                className="min-h-10 rounded-lg px-3 text-sm font-medium text-red-700 hover:bg-red-50"
                onClick={() => {
                  if (window.confirm(t('expense.confirmDelete'))) {
                    void deleteExpense(item.id)
                  }
                }}
              >
                {t('app.delete')}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
