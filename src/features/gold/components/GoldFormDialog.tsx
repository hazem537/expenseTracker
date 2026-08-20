import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { GoldForm } from '@/features/gold/components/GoldForm'
import type { GoldHoldingInput } from '@/features/gold/hooks/useGoldHoldings'

interface GoldFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: GoldHoldingInput) => Promise<void>
}

export function GoldFormDialog({ open, onOpenChange, onSubmit }: GoldFormDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('gold.add')}</DialogTitle>
          <DialogDescription>{t('gold.formHint')}</DialogDescription>
        </DialogHeader>
        <GoldForm
          key={String(open)}
          onCancel={() => onOpenChange(false)}
          onSubmit={async (values) => {
            await onSubmit(values)
            onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
