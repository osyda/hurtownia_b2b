import { headers } from 'next/headers'
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  LockKeyhole,
  PackageCheck,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Store,
  Truck,
  Users,
} from 'lucide-react'
import { LoginForm } from '@/components/shared/login-form'
import { DostawioLogo, DostawioMark } from '@/components/brand/dostawio-logo'
import { getTenantSlugFromHost } from '@/lib/shop-routing'

function humanizeTenantName(slug: string) {
  return slug
    .split('-')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export default async function LoginPage() {
  const host = (await headers()).get('host')
  const tenantSlug = getTenantSlugFromHost(host)
  const tenantName = tenantSlug ? humanizeTenantName(tenantSlug) : 'Dostawio'
  const isTenantLogin = Boolean(tenantSlug)

  const context = isTenantLogin
    ? {
        brandTitle: tenantName,
        brandSubtitle: 'B2B store',
        badge: 'Panel zamówień B2B',
        eyebrow: 'Strefa klienta hurtowni',
        headline: `Zamawiaj produkty od ${tenantName} online.`,
        description: 'Zaloguj się, żeby zobaczyć katalog, swoje ceny, dostępne formy płatności i historię zamówień.',
        cardLabel: 'Logowanie B2B',
        cardTitle: 'Witaj w panelu zamówień',
        cardDescription: 'Dostęp jest przeznaczony dla klientów B2B oraz pracowników tej hurtowni.',
        buttonLabel: 'Zaloguj się do panelu B2B',
        emailPlaceholder: 'email@twojafirma.pl',
        helperText: 'Dostęp nadaje hurtownia. Jeśli nie masz konta lub hasła, skontaktuj się ze swoim opiekunem handlowym.',
        mobileDescription: `Panel zamówień B2B hurtowni ${tenantName}.`,
        footerLabel: 'zamówienia online',
        quickCards: [
          { icon: Store, label: `${tenantSlug}.dostawio.pl` },
          { icon: ShoppingCart, label: 'Koszyk B2B' },
          { icon: ClipboardList, label: 'Historia' },
        ],
        highlights: [
          { icon: Search, label: 'Katalog', value: 'produkty i SKU' },
          { icon: CreditCard, label: 'Warunki', value: 'ceny i płatności' },
          { icon: Truck, label: 'Obsługa', value: 'statusy zamówień' },
        ],
        steps: [
          'Zaloguj się kontem otrzymanym od hurtowni.',
          'Wybierz produkty, ilości i formę płatności.',
          'Wyślij zamówienie bez telefonu i przepisywania list.',
        ],
      }
    : {
        brandTitle: 'Dostawio Connect',
        brandSubtitle: 'platforma zamówień B2B',
        badge: 'Panel właściciela',
        eyebrow: 'Dostawio Admin',
        headline: 'Zaloguj się do centrum zarządzania platformą.',
        description: 'To prywatny panel właściciela Dostawio do obsługi hurtowni, wdrożeń, klientów i gotowości platformy.',
        cardLabel: 'Dostawio ID',
        cardTitle: 'Witaj ponownie',
        cardDescription: 'Ten adres jest przeznaczony dla właściciela platformy Dostawio.',
        buttonLabel: 'Wejdź do panelu Dostawio',
        emailPlaceholder: 'wlasciciel@dostawio.pl',
        helperText: 'Hurtownie i ich klienci logują się na subdomenie swojej hurtowni, np. nazwahurtowni.dostawio.pl/login.',
        mobileDescription: 'Prywatny panel właściciela platformy Dostawio.',
        footerLabel: 'zarządzanie platformą',
        quickCards: [
          { icon: Building2, label: 'Hurtownie' },
          { icon: Users, label: 'Klienci B2B' },
          { icon: ShieldCheck, label: 'Wdrożenia' },
        ],
        highlights: [
          { icon: Building2, label: 'Hurtownie', value: 'onboarding' },
          { icon: Store, label: 'Sklepy', value: 'subdomeny B2B' },
          { icon: ShieldCheck, label: 'Kontrola', value: 'gotowość' },
        ],
        steps: [
          'Tworzysz hurtownię i administratora.',
          'Sprawdzasz płatności, katalog i klientów.',
          'Uruchamiasz sklep B2B na subdomenie hurtowni.',
        ],
      }

  return (
    <div className="premium-page min-h-screen overflow-x-hidden p-3 sm:p-4 lg:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-7xl gap-5 lg:min-h-[calc(100vh-3rem)] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="premium-hero hidden flex-col justify-between p-7 lg:flex">
          <div className="relative z-10">
            <div className="mb-10 flex items-center justify-between gap-6">
              {isTenantLogin ? (
                <div className="flex items-center gap-3">
                  <DostawioMark light className="h-11 w-11" />
                  <div>
                    <div className="text-lg font-black tracking-tight">{context.brandTitle}</div>
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
                      Dostawio Connect
                    </div>
                  </div>
                </div>
              ) : (
                <DostawioLogo light className="w-[230px]" />
              )}
              <div className="rounded-full border border-[#E08A2B]/25 bg-[#E08A2B]/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-[#F4D1A4]">
                {context.badge}
              </div>
            </div>

            <div className="premium-pill mb-5">{context.eyebrow}</div>
            <h1 className="max-w-2xl text-4xl font-black leading-[1.05] tracking-tight">
              {context.headline}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
              {context.description}
            </p>
          </div>

          <div className="relative z-10 grid gap-4">
            <div className="rounded-lg border border-white/10 bg-white/[0.08] p-4 backdrop-blur">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-black">Co możesz zrobić po zalogowaniu</div>
                  <div className="mt-1 text-xs text-slate-400">Najważniejsze funkcje dostępne od razu w panelu.</div>
                </div>
                <BadgeCheck className="h-5 w-5 text-[#F4D1A4]" />
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {context.highlights.map(item => (
                  <div key={item.label} className="rounded-lg bg-white p-4 text-slate-950">
                    <item.icon className="mb-4 h-5 w-5 text-slate-500" />
                    <div className="text-sm font-black">{item.label}</div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-lg border border-white/10 bg-white/[0.08] p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-black">
                  <LockKeyhole className="h-4 w-4 text-[#F4D1A4]" />
                  Bezpieczny dostęp
                </div>
                <p className="text-sm leading-6 text-slate-300">
                  Konto prowadzi tylko do danych przypisanych do właściwej hurtowni albo panelu operatora.
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.08] p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-black">
                  <PackageCheck className="h-4 w-4 text-[#F4D1A4]" />
                  Jak to działa
                </div>
                <div className="space-y-2">
                  {context.steps.map(step => (
                    <div key={step} className="flex items-center gap-2 text-sm text-slate-300">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[#F4D1A4]" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <main className="flex min-h-[calc(100vh-1.5rem)] items-center justify-center px-1 py-3 lg:min-h-[calc(100vh-3rem)] lg:px-10">
          <div className="w-full min-w-0 max-w-md">
            <div className="mb-4 lg:hidden">
              <DostawioMark className="mb-3 h-10 w-10" />
              <h1 className="text-2xl font-black tracking-tight text-slate-950">{context.brandTitle}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {context.mobileDescription}
              </p>
            </div>

            <div className="premium-card overflow-hidden">
              <div className="brand-gradient border-b border-slate-200/80 px-5 py-5 text-white sm:px-7 sm:py-6">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <div className="inline-flex rounded-full bg-white/10 p-2">
                    <Sparkles className="h-5 w-5 text-[#F4D1A4]" />
                  </div>
                  <div className="max-w-[118px] truncate rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-300 sm:max-w-none sm:text-xs sm:tracking-[0.16em]">
                    {context.cardLabel}
                  </div>
                </div>
                <h2 className="text-xl font-black tracking-tight sm:text-2xl">{context.cardTitle}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {context.cardDescription}
                </p>
              </div>
              <div className="p-5 sm:p-7">
                <LoginForm
                  buttonLabel={context.buttonLabel}
                  emailPlaceholder={context.emailPlaceholder}
                  helperText={context.helperText}
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 text-[11px] font-bold leading-4 text-slate-500 sm:grid-cols-3 sm:text-xs">
              {context.quickCards.map(item => (
                <div key={item.label} className="rounded-lg border border-white/70 bg-white/75 px-2.5 py-3 shadow-sm">
                  <item.icon className="mb-2 h-4 w-4 text-slate-400" />
                  <div className="break-words">{item.label}</div>
                </div>
              ))}
            </div>

            <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              {context.footerLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
