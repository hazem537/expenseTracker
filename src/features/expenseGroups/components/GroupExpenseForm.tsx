import { useRef } from 'react'
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
import type { ExpenseInput } from '@/features/expenses/hooks/useExpenses'
import type { CurrencyCode } from '@/shared/lib/currencies'

interface GroupExpenseFormProps {
  open: boolean
  groupId: string
  accounts: Account[]
  defaultCurrency: CurrencyCode
  actionsDisabled?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (input: ExpenseInput) => Promise<void>
}

export function GroupExpenseForm({
  open,
  groupId,
  accounts,
  defaultCurrency,
  actionsDisabled = false,
  onOpenChange,
  onSubmit,
}: GroupExpenseFormProps) {
  const { t } = useTranslation()
  const busyRef = useRef(false)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && busyRef.current) return
        onOpenChange(next)
      }}
    >
      <DialogContent
        onPointerDownOutside={(event) => {
          if (busyRef.current) event.preventDefault()
        }}
        onEscapeKeyDown={(event) => {
          if (busyRef.current) event.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle>{t('expenseGroups.addExpense')}</DialogTitle>
          <DialogDescription>
            {actionsDisabled
              ? t('offline.actionDisabled')
              : accounts.length === 0
                ? t('accounts.needAccountFirst')
                : t('expenseGroups.addExpenseHint')}
          </DialogDescription>
        </DialogHeader>
        {actionsDisabled ? (
          <p className="text-sm text-muted">{t('offline.actionDisabled')}</p>
        ) : (
          <ExpenseForm
            accounts={accounts}
            lockGroupId={groupId}
            defaultCurrency={defaultCurrency}
            onBusyChange={(busy) => {
              busyRef.current = busy
            }}
            onCancel={() => onOpenChange(false)}
            onSubmit={async (input) => {
              await onSubmit({ ...input, group_id: groupId })
              onOpenChange(false)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
