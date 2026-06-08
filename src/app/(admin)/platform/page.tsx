import { BadgeCheck, Building2, Globe2, PlugZap, ShieldCheck, Store, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getPlatformAppUrl, getPlatformSiteUrl, getTenantShopUrl } from '@/lib/shop-routing'

export default async function PlatformPage() {
  const supabase = await createClient()

  const [tenantsRes, customersRes, paymentMethodsRes, integrationsRes] = await Promise.all([
    supabase.from('tenants').select('id', { count: 'exact', head: true }),
    supabase.from('customers').select('id', { count: 'exact', head: true }),
    supabase.from('payment_methods').select('id', { count: 'exact', head: true }),
    supabase.from('tenant_integrations').select('id', { count: 'exact', head: true }),
  ])

  const routingCards = [
    {
      icon: Globe2,
      title: 'Strona marki',
      url: getPlatformSiteUrl(),
      description: 'Publiczna strona Dostawio dla oferty, sprzedaży i materiałów marketingowych.',
    },
    {
      icon: Building2,
      title: 'Panel administracyjny',
      url: getPlatformAppUrl(),
      description: 'Wspólny panel logowania dla superadmina oraz administratorów hurtowni.',
    },
    {
      icon: Store,
      title: 'Sklepy hurtowni',
      url: getTenantShopUrl('slug-hurtowni'),
      description: 'Każda hurtownia dostaje własny adres klienta w wildcard DNS.',
    },
  ]

  const platformStats = [
    { label: 'Hurtownie', value: tenantsRes.count ?? 0, icon: Building2 },
    { label: 'Klienci B2B', value: customersRes.count ?? 0, icon: Users },
    { label: 'Metody płatności', value: paymentMethodsRes.count ?? 0, icon: ShieldCheck },
    { label: 'Integracje', value: integrationsRes.count ?? 0, icon: PlugZap },
  ]

  const checklist = [
    'dostawio.pl działa jako publiczna domena marki',
    'app.dostawio.pl prowadzi do panelu platformy',
    '*.dostawio.pl obsługuje sklepy hurtowni',
    'nowe hurtownie dostają domyślne formy płatności',
    'slugi hurtowni nie mogą kolidować z subdomenami systemowymi',
  ]

  return (
    <div className="space-y-7 p-4 md:p-8">
      <section className="premium-hero p-6 md:p-8">
        <div className="relative z-10 max-w-3xl">
          <div className="premium-pill mb-5">
            <BadgeCheck className="mr-2 h-3.5 w-3.5" />
            Dostawio platform OS
          </div>
          <h1 className="text-3xl font-black tracking-tight md:text-5xl">
            Centrum konfiguracji platformy.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
            To jest warstwa właścicielska: domeny, model SaaS, automatyczne adresy hurtowni i przygotowanie
            pod integracje sprzedażowo-magazynowe.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {platformStats.map(stat => (
          <div key={stat.label} className="premium-stat-card">
            <stat.icon className="mb-5 h-5 w-5 text-slate-500" />
            <div className="text-sm font-bold uppercase tracking-[0.14em] text-slate-400">{stat.label}</div>
            <div className="mt-2 text-3xl font-black tracking-tight text-slate-950">{stat.value}</div>
          </div>
        ))}
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        {routingCards.map(card => (
          <a
            key={card.title}
            href={card.url}
            target="_blank"
            rel="noreferrer"
            className="premium-card block p-5 transition hover:-translate-y-0.5"
          >
            <card.icon className="mb-6 h-6 w-6 text-slate-500" />
            <h2 className="text-lg font-black tracking-tight text-slate-950">{card.title}</h2>
            <div className="mt-3 break-all font-mono text-sm font-bold text-sky-700">{card.url}</div>
            <p className="mt-4 text-sm leading-6 text-slate-500">{card.description}</p>
          </a>
        ))}
      </section>

      <section className="premium-card overflow-hidden">
        <div className="border-b border-slate-200/80 bg-white px-5 py-4">
          <h2 className="text-lg font-black tracking-tight text-slate-950">Status fundamentu Dostawio</h2>
          <p className="mt-1 text-sm text-slate-500">Elementy, które są już przygotowane pod model multi-tenant.</p>
        </div>
        <div className="grid gap-4 p-5 lg:grid-cols-2">
          {checklist.map(item => (
            <div key={item} className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <div className="text-sm font-semibold leading-6 text-slate-700">{item}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="premium-card p-5">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-950">Następny etap</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Po tym fundamencie można bezpiecznie rozbudować onboarding hurtowni, konfigurację integracji API,
              mapowanie produktów i synchronizację faktur z systemów sprzedażowych.
            </p>
          </div>
          <div className="rounded-lg bg-slate-950 px-4 py-3 text-sm font-black text-white">
            Gotowe pod skalowanie
          </div>
        </div>
      </section>
    </div>
  )
}
