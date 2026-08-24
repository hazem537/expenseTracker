import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

const fallbackOrigin = 'https://expense-tracker-rose-zeta.vercel.app'

function appOrigin() {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  return fallbackOrigin
}

/** Redirect after signup email confirmation */
export const authEmailRedirectTo =
  import.meta.env.VITE_AUTH_REDIRECT_URL || `${fallbackOrigin}/login`

/** Redirect after password-reset email */
export function authPasswordResetRedirectTo() {
  const configured = import.meta.env.VITE_AUTH_REDIRECT_URL as string | undefined
  if (configured) {
    try {
      const url = new URL(configured)
      return `${url.origin}/reset-password`
    } catch {
      /* fall through */
    }
  }
  return `${appOrigin()}/reset-password`
}

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey)
  : null
