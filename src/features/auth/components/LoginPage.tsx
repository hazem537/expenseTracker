import { useState, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { LanguageToggle } from '@/shared/ui/LanguageToggle'
import { ThemeToggle } from '@/shared/ui/ThemeToggle'
import { SetupNotice } from '@/shared/ui/SetupNotice'
import {
  isSupabaseConfigured,
  supabase,
  authEmailRedirectTo,
  authPasswordResetRedirectTo,
} from '@/shared/lib/supabase'
import iconMail from '../assets/icon-mail.svg'
import iconLock from '../assets/icon-lock.svg'
import iconEye from '../assets/icon-eye.svg'
import iconError from '../assets/icon-error.svg'

export function LoginPage() {
  const { t } = useTranslation()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleForgotPassword() {
    if (!supabase) return
    setError(null)
    setInfo(null)
    if (!email.trim()) {
      setError(t('auth.forgotNeedEmail'))
      return
    }
    setBusy(true)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: authPasswordResetRedirectTo(),
    })
    if (resetError) setError(t('auth.forgotError'))
    else setInfo(t('auth.forgotOk'))
    setBusy(false)
  }

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
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: authEmailRedirectTo },
      })
      if (authError) setError(t('auth.error'))
      else setInfo(t('auth.signupOk'))
    }
    setBusy(false)
  }

  const inputClass =
    'h-12 w-full rounded-xl border border-gold-soft bg-surface py-3.5 text-base text-ink placeholder:text-muted focus:border-gold focus:outline-none'

  return (
    <div className="app-shell flex min-h-dvh flex-col p-4">
      <div className="flex items-center justify-between gap-1">
        <Link to="/" className="px-2 text-sm font-medium text-muted hover:text-heading">
          {t('app.name')}
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <LanguageToggle />
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-96">
          {!isSupabaseConfigured ? <div className="mb-4"><SetupNotice /></div> : null}
          <div className="flex flex-col gap-6 rounded-[20px] border border-gold-soft/80 bg-surface p-6 shadow-[0_12px_28px_rgba(201,162,39,0.12)]">
            <div className="flex flex-col gap-1 text-center">
              <h1 className="text-2xl font-bold tracking-[-0.24px] text-heading">
                {mode === 'login' ? t('auth.titleLogin') : t('auth.titleSignup')}
              </h1>
              <p className="text-sm leading-5 text-muted">
                {mode === 'login' ? t('auth.subtitleLogin') : t('auth.subtitleSignup')}
              </p>
            </div>

            <form className="flex w-full flex-col gap-4" onSubmit={(e) => void handleSubmit(e)}>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold tracking-[0.6px] text-heading" htmlFor="email">
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <img
                    src={iconMail}
                    alt=""
                    width={20}
                    height={16}
                    className="pointer-events-none absolute start-2 top-1/2 h-4 w-5 -translate-y-1/2"
                  />
                  <input
                    id="email"
                    className={`${inputClass} ps-[41px] pe-[17px]`}
                    type="email"
                    autoComplete="email"
                    required
                    placeholder={t('auth.emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold tracking-[0.6px] text-heading" htmlFor="password">
                    {t('auth.password')}
                  </label>
                  {mode === 'login' ? (
                    <button
                      type="button"
                      className="text-sm leading-5 text-heading underline disabled:opacity-50"
                      disabled={busy || !isSupabaseConfigured}
                      onClick={() => void handleForgotPassword()}
                    >
                      {t('auth.forgot')}
                    </button>
                  ) : null}
                </div>
                <div className="relative">
                  <img
                    src={iconLock}
                    alt=""
                    width={16}
                    height={21}
                    className="pointer-events-none absolute start-2 top-1/2 h-[21px] w-4 -translate-y-1/2"
                  />
                  <input
                    id="password"
                    className={`${inputClass} px-[41px]`}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute end-2 top-1/2 flex h-[15px] w-[22px] -translate-y-1/2 items-center justify-center"
                    onClick={() => setShowPassword((open) => !open)}
                    aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  >
                    <img src={iconEye} alt="" width={22} height={15} className="h-[15px] w-[22px]" />
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={busy || !isSupabaseConfigured}
                  className="flex h-12 w-full items-center justify-center rounded-xl bg-navy text-base leading-6 text-gold-bright disabled:opacity-50"
                >
                  {mode === 'login' ? t('auth.submitLogin') : t('auth.submitSignup')}
                </button>
              </div>

              {error ? (
                <div className="flex items-center gap-2 rounded-lg bg-[#ffdad6] p-2">
                  <img src={iconError} alt="" width={20} height={20} className="size-5 shrink-0" />
                  <p className="text-sm leading-5 text-[#93000a]">{error}</p>
                </div>
              ) : null}
              {info ? <p className="text-sm leading-5 text-emerald-700">{info}</p> : null}
            </form>

            <div className="pt-2 text-center text-sm leading-5 text-muted">
              <span>{mode === 'login' ? t('auth.switchToSignup') : t('auth.switchToLogin')} </span>
              <button
                type="button"
                className="font-semibold text-heading"
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login')
                  setError(null)
                  setInfo(null)
                }}
              >
                {mode === 'login' ? t('auth.switchToSignupAction') : t('auth.switchToLoginAction')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
