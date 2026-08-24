import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface ExpandableRecordProps {
  expanded: boolean
  onToggle: () => void
  summary: ReactNode
  value?: ReactNode
  children: ReactNode
  className?: string
}

export function ExpandableRecord({
  expanded,
  onToggle,
  summary,
  value,
  children,
  className,
}: ExpandableRecordProps) {
  const { t } = useTranslation()

  return (
    <li
      className={cn(
        'rounded-2xl border border-gold-soft/70 bg-surface shadow-[0_12px_28px_rgba(201,162,39,0.08)]',
        className,
      )}
    >
      <button
        type="button"
        className="flex w-full min-h-12 items-center gap-2 px-3 py-2.5 text-start"
        aria-expanded={expanded}
        aria-label={expanded ? t('app.hideDetails') : t('app.showDetails')}
        onClick={onToggle}
      >
        <ChevronDown
          className={cn('size-4 shrink-0 text-muted transition-transform', expanded && 'rotate-180')}
          aria-hidden
        />
        <div className="min-w-0 flex-1">{summary}</div>
        {value != null ? <div className="max-w-[42%] shrink-0 text-end">{value}</div> : null}
      </button>
      {expanded ? (
        <div className="space-y-3 border-t border-gold-soft/50 px-3 pb-3 pt-3">{children}</div>
      ) : null}
    </li>
  )
}
