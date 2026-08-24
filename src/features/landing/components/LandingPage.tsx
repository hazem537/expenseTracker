import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeftRight,
  Coins,
  EyeOff,
  Globe2,
  Landmark,
  LayoutDashboard,
  LineChart,
  Receipt,
  ShieldCheck,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { LanguageToggle } from '@/shared/ui/LanguageToggle'
import { ThemeToggle } from '@/shared/ui/ThemeToggle'
import { AppLogo } from '@/features/shell'

const features: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Landmark, title: 'landing.featAccountsTitle', body: 'landing.featAccountsBody' },
  { icon: Receipt, title: 'landing.featExpensesTitle', body: 'landing.featExpensesBody' },
  { icon: Users, title: 'landing.featGroupsTitle', body: 'landing.featGroupsBody' },
  { icon: Coins, title: 'landing.featGoldTitle', body: 'landing.featGoldBody' },
  { icon: LineChart, title: 'landing.featStocksTitle', body: 'landing.featStocksBody' },
  { icon: LayoutDashboard, title: 'landing.featDashboardTitle', body: 'landing.featDashboardBody' },
  { icon: ArrowLeftRight, title: 'landing.featShareTitle', body: 'landing.featShareBody' },
  { icon: Globe2, title: 'landing.featLocaleTitle', body: 'landing.featLocaleBody' },
]

const services: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Wallet, title: 'landing.svcPersonalTitle', body: 'landing.svcPersonalBody' },
  { icon: Users, title: 'landing.svcFamilyTitle', body: 'landing.svcFamilyBody' },
  { icon: LineChart, title: 'landing.svcInvestTitle', body: 'landing.svcInvestBody' },
  { icon: ShieldCheck, title: 'landing.svcPrivacyTitle', body: 'landing.svcPrivacyBody' },
]

export function LandingPage() {
  const { t } = useTranslation()

  return (
    <div className="landing-page app-shell min-h-dvh overflow-x-hidden text-ink">
      <header className="sticky top-0 z-30 border-b border-gold/20 bg-cream/80 backdrop-blur-md dark:bg-navy/70">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
          <a href="#top" className="min-w-0">
            <AppLogo />
          </a>
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex" aria-label={t('app.name')}>
            <a href="#features" className="text-muted hover:text-heading">
              {t('landing.navFeatures')}
            </a>
            <a href="#services" className="text-muted hover:text-heading">
              {t('landing.navServices')}
            </a>
          </nav>
          <div className="flex shrink-0 items-center gap-1">
            <ThemeToggle />
            <LanguageToggle compact />
            <Link
              to="/login"
              className="inline-flex h-10 items-center whitespace-nowrap rounded-full bg-navy px-4 font-sans text-sm font-medium leading-none text-gold-bright shadow-[0_8px_20px_rgba(12,20,36,0.25)] transition hover:bg-navy-mid"
            >
              {t('landing.getStarted')}
            </Link>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="relative mx-auto grid max-w-6xl gap-12 px-4 pb-20 pt-12 md:grid-cols-2 md:items-center md:pt-20">
          <div className="landing-orb landing-orb-a pointer-events-none absolute -start-24 top-8 size-72 rounded-full bg-gold/25 blur-3xl" />
          <div className="landing-orb landing-orb-b pointer-events-none absolute -end-16 top-40 size-64 rounded-full bg-navy/20 blur-3xl dark:bg-gold/10" />

          <div className="landing-fade relative z-10">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-gold">{t('landing.heroEyebrow')}</p>
            <h1 className="font-title text-4xl font-normal leading-tight tracking-tight text-heading md:text-5xl">
              {t('landing.heroTitle')}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted">{t('landing.heroBody')}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/login"
                className="inline-flex min-h-12 items-center rounded-full bg-navy px-6 text-sm font-semibold text-gold-bright shadow-[0_12px_28px_rgba(201,162,39,0.22)] transition hover:-translate-y-0.5 hover:bg-navy-mid"
              >
                {t('landing.ctaPrimary')}
              </Link>
              <Link
                to="/login"
                className="inline-flex min-h-12 items-center rounded-full border border-gold/50 bg-surface/70 px-6 text-sm font-semibold text-heading backdrop-blur transition hover:-translate-y-0.5 hover:border-gold"
              >
                {t('landing.ctaSecondary')}
              </Link>
            </div>
            <ul className="mt-10 flex flex-wrap gap-2">
              {[t('landing.heroStatAccounts'), t('landing.heroStatAssets'), t('landing.heroStatShare')].map((label) => (
                <li
                  key={label}
                  className="rounded-full border border-gold-soft/80 bg-surface/80 px-3 py-1.5 text-xs font-medium text-muted"
                >
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <div className="landing-fade landing-fade-delay relative z-10" aria-hidden>
            <div className="landing-float rounded-[28px] border border-gold/40 bg-navy p-6 text-ivory shadow-[0_24px_60px_rgba(12,20,36,0.35)]">
              <div className="flex items-center justify-between">
                <AppLogo onNavy />
                <EyeOff className="size-4 text-gold-bright" />
              </div>
              <p className="mt-6 text-xs uppercase tracking-widest text-gold-soft">{t('app.navDashboard')}</p>
              <p className="mt-1 font-header text-4xl text-gold-bright">••••</p>
              <div className="mt-8 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-navy-mid p-4">
                  <Coins className="size-4 text-gold-bright" />
                  <p className="mt-3 text-xs text-gold-soft">{t('app.navGold')}</p>
                  <p className="mt-1 text-sm font-medium">{t('landing.heroStatAssets')}</p>
                </div>
                <div className="rounded-2xl bg-navy-mid p-4">
                  <Receipt className="size-4 text-gold-bright" />
                  <p className="mt-3 text-xs text-gold-soft">{t('app.navExpenses')}</p>
                  <p className="mt-1 text-sm font-medium">{t('app.navExpenseGroups')}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="border-t border-gold/15 bg-ivory/40 py-16 dark:bg-navy/20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="landing-fade mx-auto max-w-2xl text-center">
              <h2 className="font-title text-3xl font-normal tracking-tight text-heading md:text-4xl">{t('landing.featuresTitle')}</h2>
              <p className="mt-3 text-muted">{t('landing.featuresSubtitle')}</p>
            </div>
            <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <li
                    key={feature.title}
                    className="landing-card rounded-2xl border border-gold-soft/70 bg-surface p-5 shadow-[0_10px_24px_rgba(201,162,39,0.08)]"
                    style={{ animationDelay: `${80 + index * 60}ms` }}
                  >
                    <span className="flex size-10 items-center justify-center rounded-full bg-navy">
                      <Icon className="size-5 text-gold-bright" />
                    </span>
                    <h3 className="mt-4 font-title text-xl font-normal tracking-tight text-heading">{t(feature.title)}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted">{t(feature.body)}</p>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>

        <section id="services" className="py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="landing-fade mx-auto max-w-2xl text-center">
              <h2 className="font-title text-3xl font-normal tracking-tight text-heading md:text-4xl">{t('landing.servicesTitle')}</h2>
              <p className="mt-3 text-muted">{t('landing.servicesSubtitle')}</p>
            </div>
            <ul className="mt-12 grid gap-5 md:grid-cols-2">
              {services.map((service, index) => {
                const Icon = service.icon
                return (
                  <li
                    key={service.title}
                    className="landing-card group relative overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-br from-surface to-cream p-7 dark:from-navy dark:to-navy-mid"
                    style={{ animationDelay: `${100 + index * 80}ms` }}
                  >
                    <div className="pointer-events-none absolute -end-8 -top-8 size-32 rounded-full bg-gold/15 blur-2xl transition group-hover:bg-gold/25" />
                    <Icon className="relative size-8 text-gold" />
                    <h3 className="relative mt-4 font-title text-2xl font-normal tracking-tight text-heading">{t(service.title)}</h3>
                    <p className="relative mt-2 max-w-md text-sm leading-6 text-muted">{t(service.body)}</p>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>

        <section className="px-4 pb-20">
          <div className="landing-fade mx-auto max-w-4xl overflow-hidden rounded-[28px] border border-gold/40 bg-navy px-6 py-12 text-center text-ivory shadow-[0_20px_50px_rgba(12,20,36,0.3)] md:px-12">
            <h2 className="font-title text-3xl font-normal tracking-tight md:text-4xl">{t('landing.finalTitle')}</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gold-soft">{t('landing.finalBody')}</p>
            <Link
              to="/login"
              className="mt-8 inline-flex min-h-12 items-center rounded-full bg-gold px-8 text-sm font-semibold text-navy transition hover:-translate-y-0.5 hover:bg-gold-bright"
            >
              {t('landing.ctaPrimary')}
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-gold/20 px-4 py-8 text-center text-sm text-muted">
        {t('landing.footerCopy')}
      </footer>
    </div>
  )
}
