import type { Session } from '@supabase/supabase-js'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { AppHeader, BottomNav } from '@/features/shell'
import { supabase } from '@/shared/lib/supabase'

export interface RouterContext {
  session: Session | null
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
})

function RootLayout() {
  const { session } = Route.useRouteContext()

  if (!session) {
    return <Outlet />
  }

  return (
    <div className="app-shell min-h-dvh text-ink">
      <AppHeader
        signedIn
        onSignOut={() => {
          void supabase?.auth.signOut()
        }}
      />
      <main className="mx-auto max-w-[768px] px-4 pb-32 pt-6">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
