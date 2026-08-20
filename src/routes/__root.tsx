import type { Session } from '@supabase/supabase-js'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { AppHeader, BottomNav } from '@/features/shell'
import { HideMoneyProvider } from '@/shared/ui/HideMoney'
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
    <HideMoneyProvider>
      <div className="min-h-dvh bg-[#fcf8fa] text-black">
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
    </HideMoneyProvider>
  )
}
