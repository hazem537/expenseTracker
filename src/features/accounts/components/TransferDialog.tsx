import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TransferForm } from '@/features/accounts/components/TransferForm'
import type { Account, Transfer } from '@/features/accounts/hooks/useAccounts'

interface TransferDialogProps {
  open: boolean
  transfer?: Transfer | null
  onOpenChange: (open: boolean) => void
  accounts: Account[]
  onSubmit: (input: {
    fromAccountId: string
    toAccountId: string
    fromAmount: number
    toAmount: number
    occurredOn: string
    note: string
  }) => Promise<void>
}

export function TransferDialog({ open, transfer, onOpenChange, accounts, onSubmit }: TransferDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{transfer ? t('accounts.editTransfer') : t('accounts.transfer')}</DialogTitle>
          <DialogDescription>{t('accounts.transferHint')}</DialogDescription>
        </DialogHeader>
        {accounts.length >= 2 ? (
          <TransferForm
            key={transfer ? `edit-${transfer.id}` : `new-${String(open)}`}
            accounts={accounts}
            transfer={transfer}
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
