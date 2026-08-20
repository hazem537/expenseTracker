import { createContext, useContext, useState, type ReactNode } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { isMoneyHidden, setMoneyHidden } from '@/shared/lib/format'

interface HideMoneyContextValue {
  hidden: boolean
  toggle: () => void
}

const HideMoneyContext = createContext<HideMoneyContextValue>({
  hidden: false,
  toggle: () => undefined,
})

export function HideMoneyProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(isMoneyHidden)

  function toggle() {
    const next = !hidden
    setMoneyHidden(next)
    setHidden(next)
  }

  return <HideMoneyContext.Provider value={{ hidden, toggle }}>{children}</HideMoneyContext.Provider>
}

export function useHideMoney() {
  return useContext(HideMoneyContext)
}

export function HideMoneyButton() {
  const { t } = useTranslation()
  const { hidden, toggle } = useHideMoney()

  return (
    <button
      type="button"
      className="rounded-full p-2 text-[#45464d] hover:bg-white"
      aria-label={hidden ? t('app.showMoney') : t('app.hideMoney')}
      onClick={toggle}
    >
      {hidden ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
    </button>
  )
}
