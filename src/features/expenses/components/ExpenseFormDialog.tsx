import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Account } from '@/features/accounts/hooks/useAccounts'
import { ExpenseForm } from '@/features/expenses/components/ExpenseForm'
import type { Expense, ExpenseInput } from '@/features/expenses/hooks/useExpenses'
import type { CurrencyCode } from '@/shared/lib/currencies'

interface ExpenseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense?: Expense | null
  accounts: Account[]
  defaultCurrency: CurrencyCode
  onSubmit: (input: ExpenseInput) => Promise<void>
}

export function ExpenseFormDialog({
  open,
  onOpenChange,
  expense,
  accounts,
  defaultCurrency,
  onSubmit,
}: ExpenseFormDialogProps) {
  const { t } = useTranslation()
  const isEdit = Boolean(expense)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? t('app.edit') : t('app.add')}</DialogTitle>
          <DialogDescription>
            {accounts.length === 0 ? t('accounts.needAccountFirst') : t('expense.formHint')}
          </DialogDescription>
        </DialogHeader>
        {accounts.length === 0 ? (
          <Link to="/accounts" className="font-semibold underline" onClick={() => onOpenChange(false)}>
            {t('app.navAccounts')}
          </Link>
        ) : (
          <ExpenseForm
            key={expense?.id ?? 'new'}
            initial={expense ?? null}
            accounts={accounts}
            defaultCurrency={defaultCurrency}
            onCancel={() => onOpenChange(false)}
            onSubmit={onSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
