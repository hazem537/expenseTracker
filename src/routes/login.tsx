import { useState, type FormEvent } from 'react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { SetupNotice } from '../components/SetupNotice'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

export const Route = createFileRoute('/login')({
  beforeLoad: ({ context }) => {
    if (context.session) {
      throw redirect({ to: '/' })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const { t } = useTranslation()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!supabase) return
    setBusy(true)
    setError(null)
    setInfo(null)

    if (mode === 'login') {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) setError(t('auth.error'))
    } else {
      const { error: authError } = await supabase.auth.signUp({ email, password })
      if (authError) setError(t('auth.error'))
      else setInfo(t('auth.signupOk'))
    }
    setBusy(false)
  }

  const field = 'mt-1 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base'
  const label = 'block text-sm font-medium text-slate-700'

  return (
    <div className="mx-auto max-w-md space-y-4">
      {!isSupabaseConfigured ? <SetupNotice /> : null}
      <h1 className="text-2xl font-bold">
        {mode === 'login' ? t('auth.titleLogin') : t('auth.titleSignup')}
      </h1>
      <form className="space-y-4 rounded-2xl bg-white p-5 shadow-sm" onSubmit={(e) => void handleSubmit(e)}>
        <div>
          <label className={label} htmlFor="email">
            {t('auth.email')}
          </label>
          <input
            id="email"
            className={field}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className={label} htmlFor="password">
            {t('auth.password')}
          </label>
          <input
            id="password"
            className={field}
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {info ? <p className="text-sm text-emerald-700">{info}</p> : null}
        <button
          type="submit"
          disabled={busy || !isSupabaseConfigured}
          className="min-h-12 w-full rounded-xl bg-slate-900 text-base font-semibold text-white disabled:opacity-50"
        >
          {mode === 'login' ? t('auth.submitLogin') : t('auth.submitSignup')}
        </button>
      </form>
      <button
        type="button"
        className="min-h-10 w-full text-sm font-medium text-slate-600"
        onClick={() => {
          setMode(mode === 'login' ? 'signup' : 'login')
          setError(null)
          setInfo(null)
        }}
      >
        {mode === 'login' ? t('auth.switchToSignup') : t('auth.switchToLogin')}
      </button>
    </div>
  )
}
