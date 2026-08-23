import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import type { Session } from '@supabase/supabase-js'
import { routeTree } from './routeTree.gen'
import { useAuth } from '@/features/auth'
import { useTranslation } from 'react-i18next'
import {
  clearPersistedQueryCache,
  queryClient,
  queryPersister,
  shouldPersistQuery,
} from '@/shared/lib/queryClient'
import { clearOutbox, refreshOutboxCount } from '@/shared/lib/outbox'
import { flushExpenseOutbox } from '@/shared/lib/flushOutbox'
import '@/shared/lib/theme'
import '@/shared/i18n'
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
    if (!ready) return
    void router.invalidate()
    if (!session) {
      queryClient.clear()
      void clearPersistedQueryCache()
      void clearOutbox()
    } else {
      void refreshOutboxCount()
      void flushExpenseOutbox()
    }
  }, [session, ready])

  useEffect(() => {
    function onOnline() {
      void flushExpenseOutbox()
    }
    function onFocus() {
      if (navigator.onLine) void flushExpenseOutbox()
    }
    window.addEventListener('online', onOnline)
    window.addEventListener('focus', onFocus)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  if (!ready) {
    return (
      <div className="app-shell grid min-h-dvh place-items-center text-muted">
        {t('app.loading')}
      </div>
    )
  }

  return <RouterProvider router={router} context={{ session }} />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: queryPersister,
        maxAge: 1000 * 60 * 60 * 24 * 7,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            if (query.state.status !== 'success') return false
            return shouldPersistQuery(query.queryKey)
          },
        },
      }}
    >
      <App />
    </PersistQueryClientProvider>
  </StrictMode>,
)
