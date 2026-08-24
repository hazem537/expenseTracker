import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth'
import { useProfile } from '@/features/settings/hooks/useProfile'
import { useOnlineStatus } from '@/shared/lib/online'
import { isSupabaseConfigured, supabase } from '@/shared/lib/supabase'
import { SetupNotice } from '@/shared/ui/SetupNotice'

export function ProfilePage({ hideTitle = false }: { hideTitle?: boolean }) {
  const { t } = useTranslation()
  const online = useOnlineStatus()
  const { session } = useAuth()
  const { profile, loading, error, saveDisplayName } = useProfile()
  const email = session?.user?.email ?? ''

  const [displayName, setDisplayName] = useState('')
  const [nameSaved, setNameSaved] = useState(false)
  const [nameBusy, setNameBusy] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwBusy, setPwBusy] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSaved, setPwSaved] = useState(false)

  useEffect(() => {
    if (profile) setDisplayName(profile.display_name ?? '')
  }, [profile])

  async function handleSaveName(event: FormEvent) {
    event.preventDefault()
    setNameBusy(true)
    setNameSaved(false)
    setNameError(null)
    try {
      await saveDisplayName(displayName)
      setNameSaved(true)
    } catch {
      setNameError(t('profile.saveError'))
    } finally {
      setNameBusy(false)
    }
  }

  async function handleChangePassword(event: FormEvent) {
    event.preventDefault()
    if (!supabase || !email) return
    setPwBusy(true)
    setPwError(null)
    setPwSaved(false)

    if (newPassword.length < 6) {
      setPwError(t('profile.passwordTooShort'))
      setPwBusy(false)
      return
    }
    if (newPassword !== confirmPassword) {
      setPwError(t('profile.passwordMismatch'))
      setPwBusy(false)
      return
    }

    try {
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      })
      if (reauthError) {
        setPwError(t('profile.currentPasswordWrong'))
        return
      }
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) {
        setPwError(t('profile.passwordChangeError'))
        return
      }
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPwSaved(true)
    } catch {
      setPwError(t('profile.passwordChangeError'))
    } finally {
      setPwBusy(false)
    }
  }

  const inputClass =
    'mt-2 min-h-12 w-full rounded-xl border border-gold-soft bg-surface px-3 text-base disabled:opacity-60'
  const cardClass =
    'space-y-4 rounded-2xl border border-gold-soft/70 bg-surface p-5 shadow-[0_12px_28px_rgba(201,162,39,0.08)]'

  return (
    <div className="space-y-4">
      {!isSupabaseConfigured ? <SetupNotice /> : null}
      {hideTitle ? null : <h1 className="text-2xl font-bold text-heading">{t('profile.title')}</h1>}
      {loading ? <p>{t('app.loading')}</p> : null}
      {error ? <p className="text-red-600">{t('expense.error')}</p> : null}

      <section className={cardClass}>
        <h2 className="text-lg font-semibold text-heading">{t('profile.account')}</h2>
        <div>
          <label className="block text-sm font-medium text-heading" htmlFor="profile-email">
            {t('auth.email')}
          </label>
          <input
            id="profile-email"
            className={inputClass}
            type="email"
            value={email}
            readOnly
            disabled
          />
          <p className="mt-1 text-sm text-muted">{t('profile.emailHelp')}</p>
        </div>
      </section>

      {profile ? (
        <form className={cardClass} onSubmit={(e) => void handleSaveName(e)}>
          <h2 className="text-lg font-semibold text-heading">{t('profile.displayName')}</h2>
          <div>
            <label className="block text-sm font-medium text-heading" htmlFor="display-name">
              {t('profile.displayName')}
            </label>
            <p className="mt-1 text-sm text-muted">{t('profile.displayNameHelp')}</p>
            <input
              id="display-name"
              className={inputClass}
              type="text"
              maxLength={80}
              value={displayName}
              disabled={!online || nameBusy}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t('profile.displayNamePlaceholder')}
            />
          </div>
          {nameSaved ? <p className="text-sm text-emerald-700">{t('settings.saved')}</p> : null}
          {nameError ? <p className="text-sm text-red-600">{nameError}</p> : null}
          <button
            type="submit"
            disabled={nameBusy || !online}
            title={!online ? t('offline.actionDisabled') : undefined}
            className="min-h-12 w-full rounded-xl bg-navy font-semibold text-gold-bright disabled:opacity-60"
          >
            {t('app.save')}
          </button>
        </form>
      ) : null}

      <form className={cardClass} onSubmit={(e) => void handleChangePassword(e)}>
        <h2 className="text-lg font-semibold text-heading">{t('profile.changePassword')}</h2>
        <p className="text-sm text-muted">{t('profile.changePasswordHelp')}</p>
        <div>
          <label className="block text-sm font-medium text-heading" htmlFor="current-password">
            {t('profile.currentPassword')}
          </label>
          <input
            id="current-password"
            className={inputClass}
            type="password"
            autoComplete="current-password"
            required
            minLength={6}
            value={currentPassword}
            disabled={!online || pwBusy}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-heading" htmlFor="new-password">
            {t('profile.newPassword')}
          </label>
          <input
            id="new-password"
            className={inputClass}
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={newPassword}
            disabled={!online || pwBusy}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-heading" htmlFor="confirm-password">
            {t('profile.confirmPassword')}
          </label>
          <input
            id="confirm-password"
            className={inputClass}
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={confirmPassword}
            disabled={!online || pwBusy}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        {pwSaved ? <p className="text-sm text-emerald-700">{t('profile.passwordChanged')}</p> : null}
        {pwError ? <p className="text-sm text-red-600">{pwError}</p> : null}
        <button
          type="submit"
          disabled={pwBusy || !online || !email}
          title={!online ? t('offline.actionDisabled') : undefined}
          className="min-h-12 w-full rounded-xl bg-navy font-semibold text-gold-bright disabled:opacity-60"
        >
          {t('profile.changePassword')}
        </button>
      </form>
    </div>
  )
}
