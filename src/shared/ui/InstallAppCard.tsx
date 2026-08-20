import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallAppCard() {
  const { t } = useTranslation()
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [iosHint, setIosHint] = useState(false)

  useEffect(() => {
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || ('standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
    setIosHint(isIos && !standalone)

    function onPrompt(event: Event) {
      event.preventDefault()
      setPromptEvent(event as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  if (window.matchMedia('(display-mode: standalone)').matches) return null

  return (
    <section className="space-y-3 rounded-2xl border border-gold-soft/70 bg-surface p-5 shadow-[0_12px_28px_rgba(201,162,39,0.08)]">
      <h2 className="text-lg font-semibold">{t('settings.installTitle')}</h2>
      <p className="text-sm text-muted">{t('settings.installBody')}</p>
      {promptEvent ? (
        <Button
          type="button"
          className="min-h-12 w-full rounded-xl"
          onClick={async () => {
            await promptEvent.prompt()
            setPromptEvent(null)
          }}
        >
          <Download />
          {t('settings.installAction')}
        </Button>
      ) : (
        <p className="text-sm text-muted">{iosHint ? t('settings.installIos') : t('settings.installAndroid')}</p>
      )}
    </section>
  )
}
