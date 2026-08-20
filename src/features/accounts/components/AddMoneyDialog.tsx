import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AddMoneyForm } from '@/features/accounts/components/AddMoneyForm'
import type { Account } from '@/features/accounts/hooks/useAccounts'

interface AddMoneyDialogProps {
  account: Account | null
  onOpenChange: (open: boolean) => void
  onSubmit: (accountId: string, amount: number) => Promise<void>
}

export function AddMoneyDialog({ account, onOpenChange, onSubmit }: AddMoneyDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={Boolean(account)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('accounts.addMoney')}</DialogTitle>
          <DialogDescription>{t('accounts.addMoneyHint')}</DialogDescription>
        </DialogHeader>
        {account ? (
          <AddMoneyForm
            key={account.id}
            account={account}
            onCancel={() => onOpenChange(false)}
            onSubmit={async (amount) => {
              await onSubmit(account.id, amount)
              onOpenChange(false)
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
