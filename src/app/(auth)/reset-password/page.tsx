import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { ArrowLeft, LockKeyhole, MailCheck, ShieldCheck } from 'lucide-react'
import { DostawioLogo, DostawioMark } from '@/components/brand/dostawio-logo'
import { ResetPasswordForm } from '@/components/shared/reset-password-form'
import { getTenantSlugFromHost } from '@/lib/shop-routing'
import { resolveTenantContextFromHost } from '@/lib/tenant-domain'

export const metadata: Metadata = {
  title: 'Reset hasła - Dostawio Connect',
}

function humanizeTenantName(slug: string) {
  return slug
    .split('-')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export default async function ResetPasswordPage() {
  const host = (await headers()).get('host')
  const tenantContext = await resolveTenantContextFromHost(host)
  const tenantSlug = tenantContext?.slug ?? getTenantSlugFromHost(host)
  const tenantName = tenantContext?.name ?? (tenantSlug ? humanizeTenantName(tenantSlug) : 'Dostawio Connect')
  const isTenantContext = Boolean(tenantSlug)

  const context = isTenantContext
    ? {
        badge: 'Panel B2B',
        headline: `Reset hasła do panelu ${tenantName}.`,
        description: 'Podaj e-mail konta przypisanego do tej hurtowni. Link resetujący wyślemy tylko wtedy, gdy konto należy do tej subdomeny.',
        cardTitle: 'Ustaw nowe hasło',
        cardDescription: 'Po kliknięciu w link z wiadomości wrócisz tutaj i wpiszesz nowe hasło.',
      }
    : {
        badge: 'Dostawio ID',
        headline: 'Reset hasła do panelu właściciela Dostawio.',
        description: 'Ten formularz jest przeznaczony dla konta właściciela platformy. Hurtownie i klienci resetują hasło na subdomenie swojej hurtowni.',
        cardTitle: 'Odzyskaj dostęp',
        cardDescription: 'Wyślemy link do ustawienia nowego hasła, jeśli konto istnieje dla tego adresu logowania.',
      }

  return (
    <div className="premium-page min-h-screen overflow-x-hidden p-3 sm:p-4 lg:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-6xl gap-5 lg:min-h-[calc(100vh-3rem)] lg:grid-cols-[0.9fr_1.1fr]">
        <section className="premium-hero hidden flex-col justify-between p-7 lg:flex">
          <div className="relative z-10">
            <div className="mb-10 flex items-center justify-between gap-6">
              {isTenantContext ? (
                <div className="flex items-center gap-3">
                  <DostawioMark light className="h-11 w-11" />
                  <div>
                    <div className="text-lg font-black tracking-tight">{tenantName}</div>
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

            <div className="premium-pill mb-5">Bezpieczny reset hasła</div>
            <h1 className="max-w-2xl text-4xl font-black leading-[1.05] tracking-tight">
              {context.headline}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
              {context.description}
            </p>
          </div>

          <div className="relative z-10 grid gap-3">
            {[
              { icon: MailCheck, title: 'Link e-mail', text: 'Wiadomość trafia na adres przypisany do konta.' },
              { icon: ShieldCheck, title: 'Kontekst hurtowni', text: 'Konto z innej subdomeny nie przejdzie resetu w tym miejscu.' },
              { icon: LockKeyhole, title: 'Nowe hasło', text: 'Po zmianie hasła sesja jest czyszczona i wracasz do logowania.' },
            ].map(item => (
              <div key={item.title} className="rounded-lg border border-white/10 bg-white/[0.08] p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-black">
                  <item.icon className="h-4 w-4 text-[#F4D1A4]" />
                  {item.title}
                </div>
                <p className="text-sm leading-6 text-slate-300">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <main className="flex min-h-[calc(100vh-1.5rem)] items-center justify-center px-1 py-3 lg:min-h-[calc(100vh-3rem)] lg:px-10">
          <div className="w-full min-w-0 max-w-md">
            <div className="mb-4 lg:hidden">
              <DostawioMark className="mb-3 h-10 w-10" />
              <h1 className="text-2xl font-black tracking-tight text-slate-950">{tenantName}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Reset hasła do bezpiecznego panelu Dostawio.
              </p>
            </div>

            <div className="premium-card overflow-hidden">
              <div className="brand-gradient border-b border-slate-200/80 px-5 py-5 text-white sm:px-7 sm:py-6">
                <div className="mb-3 inline-flex rounded-full bg-white/10 p-2">
                  <LockKeyhole className="h-5 w-5 text-[#F4D1A4]" />
                </div>
                <h2 className="text-xl font-black tracking-tight sm:text-2xl">{context.cardTitle}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {context.cardDescription}
                </p>
              </div>
              <div className="p-5 sm:p-7">
                <ResetPasswordForm isTenantContext={isTenantContext} />
              </div>
            </div>

            <a href="/login" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950">
              <ArrowLeft className="h-4 w-4" />
              Wróć do logowania
            </a>
          </div>
        </main>
      </div>
    </div>
  )
}
