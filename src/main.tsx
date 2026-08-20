import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import type { Session } from '@supabase/supabase-js'
import { routeTree } from './routeTree.gen'
import { useAuth } from './hooks/useAuth'
import { useTranslation } from 'react-i18next'
import './i18n'
import './index.css'

const router = createRouter({
  routeTree,
  context: { session: null as Session | null },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function App() {
  const { session, ready } = useAuth()
  const { t } = useTranslation()

  useEffect(() => {
    void router.invalidate()
  }, [session])

  if (!ready) {
    return (
      <div className="grid min-h-dvh place-items-center bg-slate-50 text-slate-600">
        {t('app.loading')}
      </div>
    )
  }

  return <RouterProvider router={router} context={{ session }} />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
