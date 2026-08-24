import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

export function AppLogo({ className, onNavy }: { className?: string; onNavy?: boolean }) {
  const { t } = useTranslation()

  return (
    <span className={cn('flex items-center gap-2', className)}>
      <img src="/pwa-192.png" alt="" width={36} height={36} className="size-9 rounded-[10px]" />
      <span
        className={cn(
          'font-header text-xl font-semibold leading-7 tracking-wide',
          onNavy ? 'text-ivory' : 'text-heading',
        )}
      >
        {t('app.name')}
      </span>
    </span>
  )
}

