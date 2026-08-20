import type { Session } from '@supabase/supabase-js'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { AppHeader } from '../components/AppHeader'
import { supabase } from '../lib/supabase'

export interface RouterContext {
  session: Session | null
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
})

function RootLayout() {
  const { session } = Route.useRouteContext()

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <AppHeader
        signedIn={Boolean(session)}
        onSignOut={() => {
          void supabase?.auth.signOut()
        }}
      />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
