import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { StockForm } from '@/features/stocks/components/StockForm'
import type { StockHoldingInput } from '@/features/stocks/hooks/useStockHoldings'

interface StockFormDialogProps {
  open: boolean
  lang: string
  onOpenChange: (open: boolean) => void
  onSubmit: (values: StockHoldingInput) => Promise<void>
}

export function StockFormDialog({ open, lang, onOpenChange, onSubmit }: StockFormDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('stocks.add')}</DialogTitle>
          <DialogDescription>{t('stocks.formHint')}</DialogDescription>
        </DialogHeader>
        <StockForm
          key={String(open)}
          lang={lang}
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
