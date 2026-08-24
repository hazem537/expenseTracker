import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { LanguageToggle } from '@/shared/ui/LanguageToggle'
import { ThemeToggle } from '@/shared/ui/ThemeToggle'
import { SetupNotice } from '@/shared/ui/SetupNotice'
import { isSupabaseConfigured, supabase } from '@/shared/lib/supabase'

export const Route = createFileRoute('/reset-password')({
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!supabase) return
    let cancelled = false

    void supabase.auth.getSession().then(({ data }) => {
      if (!cancelled && data.session) setReady(true)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setReady(true)
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!supabase) return
    setBusy(true)
    setError(null)

    if (password.length < 6) {
      setError(t('profile.passwordTooShort'))
      setBusy(false)
      return
    }
    if (password !== confirm) {
      setError(t('profile.passwordMismatch'))
      setBusy(false)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError(t('auth.resetError'))
      setBusy(false)
      return
    }
    setDone(true)
    setBusy(false)
    window.setTimeout(() => {
      void navigate({ to: '/home' })
    }, 1500)
  }

  const inputClass =
    'h-12 w-full rounded-xl border border-gold-soft bg-surface px-3 text-base text-ink placeholder:text-muted focus:border-gold focus:outline-none'

  return (
    <div className="app-shell flex min-h-dvh flex-col p-4">
      <div className="flex items-center justify-end gap-1">
        <ThemeToggle />
        <LanguageToggle />
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-96">
          {!isSupabaseConfigured ? (
            <div className="mb-4">
              <SetupNotice />
            </div>
          ) : null}
          <div className="flex flex-col gap-6 rounded-[20px] border border-gold-soft/80 bg-surface p-6 shadow-[0_12px_28px_rgba(201,162,39,0.12)]">
            <div className="flex flex-col gap-1 text-center">
              <h1 className="text-2xl font-bold tracking-[-0.24px] text-heading">
                {t('auth.resetTitle')}
              </h1>
              <p className="text-sm leading-5 text-muted">{t('auth.resetSubtitle')}</p>
            </div>

            {!ready && !done ? (
              <p className="text-sm text-muted" role="status">
                {t('auth.resetWaiting')}
              </p>
            ) : null}

            {ready && !done ? (
              <form className="flex w-full flex-col gap-4" onSubmit={(e) => void handleSubmit(e)}>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-heading" htmlFor="new-password">
                    {t('profile.newPassword')}
                  </label>
                  <input
                    id="new-password"
                    className={inputClass}
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-heading" htmlFor="confirm-password">
                    {t('profile.confirmPassword')}
                  </label>
                  <input
                    id="confirm-password"
                    className={inputClass}
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy || !isSupabaseConfigured}
                  className="flex h-12 w-full items-center justify-center rounded-xl bg-navy text-base text-gold-bright disabled:opacity-50"
                >
                  {t('auth.resetSubmit')}
                </button>
                {error ? <p className="text-sm text-red-600">{error}</p> : null}
              </form>
            ) : null}

            {done ? (
              <p className="text-sm text-emerald-700" role="status">
                {t('auth.resetOk')}
              </p>
            ) : null}

            <p className="text-center text-sm text-muted">
              <Link to="/login" className="font-semibold text-heading">
                {t('auth.switchToLoginAction')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
