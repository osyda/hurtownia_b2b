import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  CreditCard,
  Globe2,
  Layers3,
  PlugZap,
  ShoppingCart,
  Store,
  Users,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getPlatformAppUrl, getTenantShopUrl, isPlatformMarketingHost } from '@/lib/shop-routing'

export default async function RootPage() {
  const headersList = await headers()
  const host = headersList.get('host')

  if (isPlatformMarketingHost(host)) {
    return <MarketingLanding />
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, tenant_id')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) redirect('/login')

  if (profile.role === 'super_admin') {
    redirect('/dashboard')
  }

  if (profile.role === 'tenant_admin' || profile.role === 'tenant_employee') {
    if (!profile.tenant_id) redirect('/login')

    const { data: tenant } = await supabase
      .from('tenants')
      .select('slug')
      .eq('id', profile.tenant_id)
      .maybeSingle()

    if (tenant?.slug) redirect(`/${tenant.slug}/dashboard`)
    redirect('/login')
  }

  if (profile.role === 'customer') {
    const { data: customer } = await supabase
      .from('customers')
      .select('tenant_id, tenants(slug)')
      .eq('user_id', user.id)
      .maybeSingle()

    const tenantSlug = (customer?.tenants as unknown as { slug: string } | null)?.slug
    if (tenantSlug) redirect(getTenantShopUrl(tenantSlug))
    redirect('/login')
  }

  redirect('/login')
}

function MarketingLanding() {
  const appLoginUrl = getPlatformAppUrl('/login')
  const demoShopUrl = getTenantShopUrl('test')

  const features = [
    {
      icon: Building2,
      title: 'Panel hurtowni',
      text: 'Każda hurtownia pracuje na swoim koncie, katalogu, klientach, cennikach i zamówieniach.',
    },
    {
      icon: Globe2,
      title: 'Sklep na subdomenie',
      text: 'Klient wchodzi na adres hurtowni, np. nazwahurtowni.dostawio.pl, bez szukania panelu.',
    },
    {
      icon: PlugZap,
      title: 'Gotowe pod integracje',
      text: 'Architektura jest przygotowana pod API, faktury, stany magazynowe i systemy sprzedażowe.',
    },
  ]

  const flow = [
    'Tworzysz hurtownię w panelu Dostawio',
    'Hurtownia dodaje klientów, towary i cenniki',
    'Klienci składają zamówienia na własnej subdomenie',
    'Integracje mogą synchronizować faktury, statusy i magazyn',
  ]

  const audiences = [
    {
      icon: Building2,
      title: 'Ty jako operator platformy',
      text: 'W app.dostawio.pl widzisz wszystkie hurtownie, ich gotowość, statusy i adresy sklepów.',
      bullets: ['superadmin', 'onboarding hurtowni', 'kontrola uruchomienia'],
    },
    {
      icon: Store,
      title: 'Hurtownia',
      text: 'Ta sama aplikacja prowadzi firmę do własnego panelu: produkty, klienci, płatności, dostawy i integracje.',
      bullets: ['panel firmy', 'cenniki B2B', 'zamówienia'],
    },
    {
      icon: Users,
      title: 'Klient hurtowni',
      text: 'Klient trafia na subdomenę hurtowni i składa zamówienie w środowisku przypisanym do tej firmy.',
      bullets: ['*.dostawio.pl', 'katalog klienta', 'historia zamówień'],
    },
  ]

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:34px_34px]" />
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-sky-500/20 to-transparent" />

        <div className="relative mx-auto grid min-h-screen max-w-7xl gap-10 px-5 py-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8">
          <div className="flex flex-col justify-between">
            <nav className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-sm font-black text-slate-950">
                  D
                </div>
                <div>
                  <div className="text-lg font-black tracking-tight">Dostawio</div>
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    B2B dla hurtowni
                  </div>
                </div>
              </div>
              <a
                href={appLoginUrl}
                className="rounded-lg border border-white/15 px-4 py-2 text-sm font-bold text-white transition hover:bg-white hover:text-slate-950"
              >
                Panel
              </a>
            </nav>

            <div className="py-12 lg:py-0">
              <div className="mb-5 inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-sky-100">
                Platforma zamówień B2B
              </div>
              <h1 className="max-w-3xl text-5xl font-black leading-[0.98] tracking-tight md:text-7xl">
                Dostawio.pl
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                Premium panel dla hurtowni, które chcą przyjmować zamówienia od klientów B2B na własnych subdomenach,
                zarządzać cennikami i przygotować się pod integracje z systemami sprzedażowo-magazynowymi.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={appLoginUrl}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-2xl shadow-sky-950/30 transition hover:-translate-y-0.5"
                >
                  Przejdź do panelu
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href={demoShopUrl}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  Zobacz sklep hurtowni
                </a>
              </div>
            </div>

            <div className="grid gap-3 pb-2 sm:grid-cols-3">
              {[
                ['Panel', 'app.dostawio.pl'],
                ['Sklepy', '*.dostawio.pl'],
                ['Domena', 'dostawio.pl'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{label}</div>
                  <div className="mt-2 font-mono text-sm font-black text-slate-100">{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center py-10">
            <div className="w-full rounded-lg border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/30 backdrop-blur">
              <div className="rounded-lg border border-white/10 bg-slate-900/90">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <div>
                    <div className="text-sm font-black">Panel Dostawio</div>
                    <div className="mt-1 text-xs text-slate-500">Widok właściciela hurtowni</div>
                  </div>
                  <div className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-200">
                    Online
                  </div>
                </div>

                <div className="grid gap-3 p-4 md:grid-cols-3">
                  {[
                    { icon: ShoppingCart, label: 'Zamówienia', value: '128' },
                    { icon: Users, label: 'Klienci', value: '42' },
                    { icon: CreditCard, label: 'Płatności', value: '4 metody' },
                  ].map(item => (
                    <div key={item.label} className="rounded-lg bg-white p-4 text-slate-950">
                      <item.icon className="mb-4 h-5 w-5 text-slate-500" />
                      <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{item.label}</div>
                      <div className="mt-2 text-2xl font-black">{item.value}</div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 p-4 pt-0 lg:grid-cols-[1fr_0.72fr]">
                  <div className="rounded-lg bg-white p-4 text-slate-950">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="font-black">Ostatnie zamówienia</div>
                      <BadgeCheck className="h-5 w-5 text-emerald-500" />
                    </div>
                    {[
                      ['ZAM-20260608-0004', 'Restauracja Spokojna', '1 284,40 zł'],
                      ['ZAM-20260608-0003', 'Sklep Centrum', '842,10 zł'],
                      ['ZAM-20260608-0002', 'Bistro Rynek', '2 108,75 zł'],
                    ].map(([number, customer, amount]) => (
                      <div key={number} className="grid grid-cols-[1fr_auto] gap-4 border-t border-slate-100 py-3">
                        <div className="min-w-0">
                          <div className="truncate font-mono text-xs font-black">{number}</div>
                          <div className="mt-1 truncate text-sm text-slate-500">{customer}</div>
                        </div>
                        <div className="text-sm font-black">{amount}</div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-lg bg-white p-4 text-slate-950">
                    <div className="mb-4 font-black">Model platformy</div>
                    <div className="space-y-3">
                      {flow.map((item, index) => (
                        <div key={item} className="flex gap-3">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white">
                            {index + 1}
                          </div>
                          <div className="text-sm font-semibold leading-6 text-slate-700">{item}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-20 text-slate-950 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-slate-400">
              <Layers3 className="h-4 w-4" />
              Architektura SaaS
            </div>
            <h2 className="text-3xl font-black tracking-tight md:text-5xl">
              Jedna platforma, osobne hurtownie, osobne sklepy klientów.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {features.map(feature => (
              <div key={feature.title} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <feature.icon className="mb-6 h-6 w-6 text-slate-500" />
                <h3 className="text-lg font-black">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-500">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-5 py-20 text-slate-950 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
            <div>
              <div className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-slate-400">
                Model dostępu
              </div>
              <h2 className="text-3xl font-black tracking-tight md:text-5xl">
                Jeden produkt, trzy osobne doświadczenia.
              </h2>
              <p className="mt-5 text-sm leading-7 text-slate-500">
                Docelowy układ zostaje prosty: panel operacyjny na app.dostawio.pl, sklepy klientów na subdomenach
                hurtowni i publiczna strona sprzedażowa na dostawio.pl.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {audiences.map(audience => (
                <div key={audience.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <audience.icon className="mb-5 h-6 w-6 text-slate-500" />
                  <h3 className="text-lg font-black">{audience.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-500">{audience.text}</p>
                  <div className="mt-5 space-y-2">
                    {audience.bullets.map(bullet => (
                      <div key={bullet} className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        {bullet}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
