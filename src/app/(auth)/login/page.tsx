import { LoginForm } from '@/components/shared/login-form'
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Globe2,
  LockKeyhole,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Store,
  Truck,
  Users,
} from 'lucide-react'

export default function LoginPage() {
  const highlights = [
    { icon: Building2, label: 'Superadmin', value: 'wszystkie hurtownie' },
    { icon: Store, label: 'Hurtownia', value: 'towary, klienci, ceny' },
    { icon: Users, label: 'Klient B2B', value: 'zamówienia na subdomenie' },
  ]

  const launchSteps = [
    'Tworzysz hurtownię w panelu Dostawio',
    'Hurtownia uzupełnia katalog, płatności i dostawy',
    'Klient zamawia na adresie swojej hurtowni',
  ]

  return (
    <div className="premium-page min-h-screen p-4 lg:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl gap-5 lg:min-h-[calc(100vh-3rem)] lg:grid-cols-[1.08fr_0.92fr]">
        <section className="premium-hero hidden flex-col justify-between p-8 lg:flex">
          <div className="relative z-10">
            <div className="mb-10 flex items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-sm font-black text-slate-950">
                  D
                </div>
                <div>
                  <div className="text-lg font-black tracking-tight">Dostawio</div>
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
                    B2B commerce OS
                  </div>
                </div>
              </div>
              <div className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-emerald-100">
                app.dostawio.pl
              </div>
            </div>

            <div className="premium-pill mb-5">Panel operacyjny dla hurtowni</div>
            <h1 className="max-w-2xl text-5xl font-black leading-[1.02] tracking-tight">
              Jedno wejście do całej platformy B2B.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
              Ty zarządzasz hurtowniami, hurtownia swoim panelem, a klienci składają zamówienia
              na subdomenie konkretnej firmy. Bez chaosu, bez ręcznego prowadzenia zamówień.
            </p>
          </div>

          <div className="relative z-10 grid gap-4">
            <div className="rounded-lg border border-white/10 bg-white/[0.08] p-4 backdrop-blur">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-black">Mapa dostępu</div>
                  <div className="mt-1 text-xs text-slate-400">Platforma, hurtownie i klienci w jednym modelu.</div>
                </div>
                <BadgeCheck className="h-5 w-5 text-emerald-200" />
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {highlights.map(item => (
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
                  <ShieldCheck className="h-4 w-4 text-sky-200" />
                  Bezpieczne role
                </div>
                <p className="text-sm leading-6 text-slate-300">
                  Dostęp jest rozdzielony na superadmina, hurtownię i klienta. Każda grupa widzi tylko swój obszar.
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.08] p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-black">
                  <PackageCheck className="h-4 w-4 text-emerald-200" />
                  Start hurtowni
                </div>
                <div className="space-y-2">
                  {launchSteps.map(step => (
                    <div key={step} className="flex items-center gap-2 text-sm text-slate-300">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-200" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <main className="flex min-h-[calc(100vh-2rem)] items-center justify-center px-1 py-6 lg:min-h-[calc(100vh-3rem)] lg:px-10">
          <div className="w-full max-w-md">
            <div className="mb-7 lg:hidden">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-950 text-lg font-black text-white shadow-xl shadow-slate-900/20">
                D
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950">Dostawio</h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Zaloguj się do panelu platformy, panelu hurtowni albo sklepu klienta.
              </p>
            </div>

            <div className="premium-card overflow-hidden">
              <div className="border-b border-slate-200/80 bg-slate-950 px-8 py-7 text-white">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div className="inline-flex rounded-full bg-white/10 p-2">
                    <Sparkles className="h-5 w-5 text-sky-200" />
                  </div>
                  <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-slate-300">
                    Dostawio ID
                  </div>
                </div>
                <h2 className="text-2xl font-black tracking-tight">Witaj ponownie</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Jeden login prowadzi do właściwego miejsca: superadmina, hurtowni albo panelu klienta.
                </p>
              </div>
              <div className="p-8">
                <LoginForm />
              </div>
            </div>

            <div className="mt-5 grid gap-2 text-xs font-bold text-slate-500 sm:grid-cols-3">
              <div className="rounded-lg border border-white/70 bg-white/70 px-3 py-2">
                <Globe2 className="mb-2 h-4 w-4 text-slate-400" />
                app.dostawio.pl
              </div>
              <div className="rounded-lg border border-white/70 bg-white/70 px-3 py-2">
                <Truck className="mb-2 h-4 w-4 text-slate-400" />
                panel hurtowni
              </div>
              <div className="rounded-lg border border-white/70 bg-white/70 px-3 py-2">
                <LockKeyhole className="mb-2 h-4 w-4 text-slate-400" />
                bezpieczne sesje
              </div>
            </div>

            <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Przejrzysty handel B2B
              <ArrowRight className="h-3.5 w-3.5" />
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
