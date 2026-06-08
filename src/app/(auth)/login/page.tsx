import { LoginForm } from '@/components/shared/login-form'
import { PackageCheck, ShieldCheck, Sparkles, Truck } from 'lucide-react'

export default function LoginPage() {
  const highlights = [
    { icon: PackageCheck, label: 'Katalog', value: 'produkty i ceny' },
    { icon: Truck, label: 'Zamówienia', value: 'statusy i dostawy' },
    { icon: ShieldCheck, label: 'Bezpieczeństwo', value: 'role i RLS' },
  ]

  return (
    <div className="premium-page grid min-h-screen p-4 lg:grid-cols-[1.08fr_0.92fr] lg:p-6">
      <section className="premium-hero hidden min-h-[calc(100vh-3rem)] flex-col justify-between p-8 lg:flex">
        <div className="relative z-10">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-sm font-black text-slate-950">
              D
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight">Dostawio</div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
                Premium wholesale portal
              </div>
            </div>
          </div>

          <div className="premium-pill mb-5">Panel zakupowy dla hurtowni</div>
          <h1 className="max-w-2xl text-5xl font-black leading-[1.02] tracking-tight">
            Zamówienia B2B, cenniki i klienci w jednym eleganckim systemie.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
            Portal dla hurtowni, który wygląda profesjonalnie od pierwszego logowania i daje szybką
            kontrolę nad sprzedażą.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-3">
          {highlights.map(item => (
            <div key={item.label} className="rounded-lg border border-white/10 bg-white/10 p-4 backdrop-blur">
              <item.icon className="mb-4 h-5 w-5 text-sky-200" />
              <div className="text-sm font-bold">{item.label}</div>
              <div className="mt-1 text-xs text-slate-400">{item.value}</div>
            </div>
          ))}
        </div>
      </section>

      <main className="flex min-h-[calc(100vh-2rem)] items-center justify-center px-2 py-8 lg:min-h-[calc(100vh-3rem)] lg:px-10">
        <div className="w-full max-w-md">
          <div className="mb-7 lg:hidden">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-950 text-lg font-black text-white shadow-xl shadow-slate-900/20">
              D
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950">Dostawio</h1>
            <p className="mt-2 text-sm text-slate-500">Zaloguj się do portalu hurtowni.</p>
          </div>

          <div className="premium-card overflow-hidden">
            <div className="border-b border-slate-200/80 bg-slate-950 px-8 py-7 text-white">
              <div className="mb-3 inline-flex rounded-full bg-white/10 p-2">
                <Sparkles className="h-5 w-5 text-sky-200" />
              </div>
              <h2 className="text-2xl font-black tracking-tight">Witaj ponownie</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Zaloguj się, aby zarządzać zamówieniami, katalogiem i klientami.
              </p>
            </div>
            <div className="p-8">
              <LoginForm />
            </div>
          </div>

          <p className="mt-5 text-center text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
            Secure B2B commerce
          </p>
        </div>
      </main>
    </div>
  )
}
