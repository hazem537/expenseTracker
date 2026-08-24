import { Navigate, getRouteApi } from '@tanstack/react-router'

const rootRoute = getRouteApi('__root__')

export function NotFoundRedirect() {
  const { session } = rootRoute.useRouteContext()
  return <Navigate to={session ? '/home' : '/'} replace />
}
