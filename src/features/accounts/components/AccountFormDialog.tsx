import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AccountForm,
  type AccountFormValues,
} from '@/features/accounts/components/AccountForm'
import type { Account } from '@/features/accounts/hooks/useAccounts'
import type { CurrencyCode } from '@/shared/lib/currencies'

interface AccountFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultCurrency: CurrencyCode
  account?: Account | null
  onSubmit: (values: AccountFormValues) => Promise<void>
}

export function AccountFormDialog({
  open,
  onOpenChange,
  defaultCurrency,
  account,
  onSubmit,
}: AccountFormDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{account ? t('app.edit') : t('accounts.add')}</DialogTitle>
          <DialogDescription>{account ? t('accounts.editHint') : t('accounts.formHint')}</DialogDescription>
        </DialogHeader>
        <AccountForm
          key={`${String(open)}-${account?.id ?? 'new'}`}
          defaultCurrency={defaultCurrency}
          initial={
            account
              ? { name: account.name, currency: account.currency, balance: account.balance }
              : null
          }
          onCancel={() => onOpenChange(false)}
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  )
}
