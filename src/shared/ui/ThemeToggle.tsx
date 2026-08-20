import { Moon, Sun } from 'lucide-react'
import { useCallback, useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { getTheme, subscribeTheme, toggleTheme } from '@/shared/lib/theme'

export function ThemeToggle() {
  const { t } = useTranslation()
  const theme = useSyncExternalStore(subscribeTheme, getTheme, getTheme)
  const onToggle = useCallback(() => {
    toggleTheme()
  }, [])
  const dark = theme === 'dark'

  return (
    <button
      type="button"
      className="rounded-full p-2 text-ink hover:bg-navy hover:text-gold-bright"
      aria-label={dark ? t('app.lightMode') : t('app.darkMode')}
      onClick={onToggle}
    >
      {dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </button>
  )
}
