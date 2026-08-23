import type { Session } from '@supabase/supabase-js'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { AppHeader, BottomNav } from '@/features/shell'
import { OfflineBanner } from '@/shared/ui/OfflineBanner'
import { supabase } from '@/shared/lib/supabase'

export interface RouterContext {
  session: Session | null
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
})

function RootLayout() {
  const { session } = Route.useRouteContext()
  const { t } = useTranslation()

  if (!session) {
    return <Outlet />
  }

  return (
    <div className="app-shell min-h-dvh text-ink">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-navy focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-gold-bright"
      >
        {t('app.skipToContent')}
      </a>
      <AppHeader
        signedIn
        onSignOut={() => {
          void supabase?.auth.signOut()
        }}
      />
      <OfflineBanner />
      <main id="main-content" className="mx-auto max-w-[768px] px-4 pb-32 pt-6" tabIndex={-1}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
