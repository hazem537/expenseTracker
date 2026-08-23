import { useEffect, useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { useOnlineStatus } from '@/shared/lib/online'
import {
  getOutboxCountSnapshot,
  refreshOutboxCount,
  subscribeOutbox,
} from '@/shared/lib/outbox'

export function OfflineBanner() {
  const { t } = useTranslation()
  const online = useOnlineStatus()
  const pending = useSyncExternalStore(subscribeOutbox, getOutboxCountSnapshot, () => 0)

  useEffect(() => {
    void refreshOutboxCount()
  }, [])

  if (online && pending === 0) return null

  return (
    <div
      className="mx-auto max-w-[768px] px-4 pt-2"
      role="status"
      aria-live="polite"
    >
      <p
        className={`rounded-xl px-3 py-2 text-sm font-medium ${
          online
            ? 'border border-gold-soft/70 bg-gold-soft/30 text-heading'
            : 'border border-amber-300/80 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100'
        }`}
      >
        {!online
          ? t('offline.banner')
          : pending === 1
            ? t('offline.pendingOne')
            : t('offline.pendingMany', { count: pending })}
      </p>
    </div>
  )
}
