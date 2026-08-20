import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TransferForm } from '@/features/accounts/components/TransferForm'
import type { Account } from '@/features/accounts/hooks/useAccounts'

interface TransferDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accounts: Account[]
  onSubmit: (input: {
    fromAccountId: string
    toAccountId: string
    fromAmount: number
    toAmount: number
  }) => Promise<void>
}

export function TransferDialog({ open, onOpenChange, accounts, onSubmit }: TransferDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('accounts.transfer')}</DialogTitle>
          <DialogDescription>{t('accounts.transferHint')}</DialogDescription>
        </DialogHeader>
        {accounts.length >= 2 ? (
          <TransferForm
            key={String(open)}
            accounts={accounts}
            onCancel={() => onOpenChange(false)}
            onSubmit={async (input) => {
              await onSubmit(input)
              onOpenChange(false)
            }}
          />
        ) : (
          <p className="text-sm text-neutral-600">{t('accounts.needTwoAccounts')}</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
