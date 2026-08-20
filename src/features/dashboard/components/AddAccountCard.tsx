import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { dashboardCard } from '@/features/dashboard/lib/styles'

interface AddAccountCardProps {
  onClick: () => void
}

export function AddAccountCard({ onClick }: AddAccountCardProps) {
  const { t } = useTranslation()

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${dashboardCard} flex h-[114px] w-40 shrink-0 flex-col items-center justify-center rounded-xl border-dashed`}
    >
      <Plus className="size-3.5 text-[#505f76]" />
      <span className="pt-1 text-sm leading-5 text-[#505f76]">{t('dashboard.addAccount')}</span>
    </button>
  )
}
