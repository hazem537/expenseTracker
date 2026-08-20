import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ConfirmDialogProps {
  open: boolean
  title?: string
  description: string
  confirmLabel?: string
  onOpenChange: (open: boolean) => void
  onConfirm: () => void | Promise<void>
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onOpenChange,
  onConfirm,
}: ConfirmDialogProps) {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (saving) return
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title ?? t('app.confirmTitle')}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="destructive"
            className="min-h-11 flex-1 rounded-xl"
            disabled={saving}
            onClick={() => {
              setSaving(true)
              void Promise.resolve(onConfirm())
                .then(() => onOpenChange(false))
                .finally(() => setSaving(false))
            }}
          >
            {confirmLabel ?? t('app.delete')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="min-h-11 rounded-xl"
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            {t('app.cancel')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
