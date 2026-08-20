import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

interface AddExpenseFabProps {
  onClick: () => void
}

export function AddExpenseFab({ onClick }: AddExpenseFabProps) {
  const { t } = useTranslation()

  return (
    <Button
      type="button"
      size="fab"
      className="fixed end-4 bottom-20 z-10 shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] md:hidden [&_svg]:size-5"
      aria-label={t('app.add')}
      onClick={onClick}
    >
      <Plus />
    </Button>
  )
}
