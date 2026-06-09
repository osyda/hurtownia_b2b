import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  CreditCard,
  PackageCheck,
  PlugZap,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Store,
  Users,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { DostawioLogo } from '@/components/brand/dostawio-logo'
import { getPlatformSiteUrl, getTenantShopUrl, isPlatformMarketingHost } from '@/lib/shop-routing'

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
  const loginUrl = getPlatformSiteUrl('/login')
  const demoShopUrl = getTenantShopUrl('test')
  const contactHref = 'mailto:kontakt@dostawio.pl?subject=Rozmowa%20o%20Dostawio'

  const outcomes = [
    {
      icon: Clock3,
      title: 'Mniej telefonów i przepisywania zamówień',
      text: 'Klient składa zamówienie samodzielnie, a hurtownia dostaje uporządkowaną listę pozycji w panelu.',
    },
    {
      icon: CreditCard,
      title: 'Warunki handlowe dla każdego klienta',
      text: 'Indywidualne ceny, grupy cenowe, minimum zamówienia oraz przypisane formy płatności.',
    },
    {
      icon: PlugZap,
      title: 'Gotowość pod ERP, magazyn i faktury',
      text: 'API i model danych są przygotowane pod synchronizację stanów, statusów, faktur i kontrahentów.',
    },
  ]

  const customerFlow = [
    {
      icon: Store,
      title: 'Klient wchodzi na adres hurtowni',
      text: 'np. twojahurtownia.dostawio.pl - bez szukania aplikacji i bez wspólnego marketplace.',
    },
    {
      icon: PackageCheck,
      title: 'Widoczny jest jego katalog i cennik',
      text: 'Klient widzi produkty, jednostki, VAT, swoje ceny i dostępne dla niego formy płatności.',
    },
    {
      icon: ShoppingCart,
      title: 'Zamówienie trafia do panelu hurtowni',
      text: 'Hurtownia widzi klienta, pozycje, wartość, notatki, płatność i historię zamówień.',
    },
  ]

  const included = [
    'osobny adres B2B dla hurtowni',
    'panel produktów, kategorii i importu',
    'klienci B2B z indywidualnymi cennikami',
    'formy płatności przypisywane do klienta',
    'koszyk i historia zamówień klienta',
    'powiadomienia e-mail o zamówieniach',
    'API pod integracje sprzedażowo-magazynowe',
    'checklista wdrożenia hurtowni',
  ]

  const plans = [
    {
      name: 'Start B2B',
      price: '399 zł',
      period: '/ mies. netto',
      badge: 'dla pierwszego wdrożenia',
      description: 'Dla hurtowni, która chce szybko uruchomić zamówienia online dla stałych klientów.',
      features: ['1 hurtownia na subdomenie', 'do 1 000 produktów', 'do 50 klientów B2B', 'cenniki, płatności i zamówienia'],
    },
    {
      name: 'Pro B2B',
      price: '699 zł',
      period: '/ mies. netto',
      badge: 'najlepszy wybór',
      description: 'Dla hurtowni, która chce potraktować panel jako stały kanał sprzedaży B2B.',
      features: ['do 10 000 produktów', 'do 250 klientów B2B', 'import produktów i stanów', 'priorytetowe wsparcie wdrożeniowe'],
      featured: true,
    },
    {
      name: 'Integracje',
      price: '1 190 zł',
      period: '/ mies. netto',
      badge: 'ERP i automatyzacja',
      description: 'Dla firm, które chcą spinać Dostawio z systemem sprzedażowym, magazynowym lub księgowym.',
      features: ['API integracyjne', 'statusy i faktury w panelu', 'synchronizacja stanów po SKU', 'indywidualna konfiguracja konektora'],
    },
  ]

  return (
    <main className="min-h-screen bg-[#F7F5EF] text-slate-950">
      <section className="relative overflow-hidden bg-[#303030] text-white">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:34px_34px]" />
        <div className="absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-[#27C7C3]/20 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(15,77,56,0.55),transparent_34rem)]" />

        <div className="relative mx-auto max-w-7xl px-5 py-6 lg:px-8">
          <nav className="flex items-center justify-between gap-5 py-3">
            <DostawioLogo light className="[&>div>div:first-child]:text-2xl" />
            <div className="flex items-center gap-2">
              <a href={loginUrl} className="hidden rounded-lg px-3 py-2 text-sm font-bold text-slate-300 transition hover:text-white sm:block">
                Logowanie
              </a>
              <a
                href={contactHref}
                className="rounded-lg bg-white px-4 py-2 text-sm font-black text-[#303030] transition hover:-translate-y-0.5"
              >
                Umów rozmowę
              </a>
            </div>
          </nav>

          <div className="grid min-h-[calc(100vh-5rem)] gap-10 py-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:py-16">
            <div>
              <div className="mb-5 inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-teal-100">
                Platforma dla hurtowni, nie kolejny sklep internetowy
              </div>
              <h1 className="max-w-4xl text-5xl font-black leading-[0.98] tracking-tight md:text-7xl">
                Przyjmuj zamówienia B2B online, bez telefonu, arkuszy i chaosu.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                Dostawio daje hurtowni własny panel B2B, osobny adres dla klientów, indywidualne cenniki,
                formy płatności i gotowość pod integracje z systemem sprzedażowo-magazynowym.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={contactHref}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-black text-[#303030] shadow-2xl shadow-slate-950/25 transition hover:-translate-y-0.5"
                >
                  Porozmawiajmy o wdrożeniu
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href={demoShopUrl}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  Zobacz przykład sklepu B2B
                </a>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  ['Bez prowizji', 'stały abonament'],
                  ['Subdomena hurtowni', 'własny adres B2B'],
                  ['Klienci B2B', 'ceny i płatności per klient'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
                    <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{label}</div>
                    <div className="mt-2 text-sm font-black text-slate-100">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.07] p-4 shadow-2xl shadow-black/30 backdrop-blur">
              <div className="rounded-lg bg-[#FBFAF6] p-4 text-slate-950">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <div className="text-sm font-black">Panel hurtowni</div>
                    <div className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      zamówienia z ostatnich 24h
                    </div>
                  </div>
                  <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                    online
                  </div>
                </div>

                <div className="grid gap-3 py-4 md:grid-cols-3">
                  {[
                    { icon: ShoppingCart, label: 'Zamówienia', value: '32' },
                    { icon: Users, label: 'Klienci B2B', value: '118' },
                    { icon: CreditCard, label: 'Płatności', value: '7/14/30 dni' },
                  ].map(item => (
                    <div key={item.label} className="rounded-lg bg-white p-4">
                      <item.icon className="mb-4 h-5 w-5 text-slate-500" />
                      <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{item.label}</div>
                      <div className="mt-2 text-xl font-black">{item.value}</div>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg border border-slate-100">
                  {[
                    ['Restauracja Spokojna', '24 pozycje', '1 284,40 zł'],
                    ['Sklep Centrum', '12 pozycji', '842,10 zł'],
                    ['Bistro Rynek', '31 pozycji', '2 108,75 zł'],
                  ].map(([customer, items, amount]) => (
                    <div key={customer} className="grid grid-cols-[1fr_auto] gap-4 border-b border-slate-100 p-4 last:border-b-0">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black">{customer}</div>
                        <div className="mt-1 text-xs font-semibold text-slate-400">{items}</div>
                      </div>
                      <div className="text-right text-sm font-black">{amount}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-slate-400">
              <Sparkles className="h-4 w-4" />
              Co zyskuje hurtownia
            </div>
            <h2 className="text-3xl font-black tracking-tight md:text-5xl">
              Stały kanał zamówień B2B, który pracuje także po godzinach.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {outcomes.map(outcome => (
              <div key={outcome.title} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <outcome.icon className="mb-6 h-6 w-6 text-slate-500" />
                <h3 className="text-lg font-black">{outcome.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-500">{outcome.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#FBFAF6] px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <div className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-slate-400">
                Jak zamawia klient hurtowni
              </div>
              <h2 className="text-3xl font-black tracking-tight md:text-5xl">
                Klient widzi tylko ofertę swojej hurtowni.
              </h2>
              <p className="mt-5 text-sm leading-7 text-slate-500">
                Dostawio nie udaje marketplace. Każda hurtownia dostaje własną przestrzeń B2B,
                a jej klienci zamawiają pod jej marką, z jej cennikiem i jej warunkami handlowymi.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {customerFlow.map((step, index) => (
                <div key={step.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex items-center justify-between">
                    <step.icon className="h-6 w-6 text-slate-500" />
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0F4D38] text-xs font-black text-white">
                      {index + 1}
                    </div>
                  </div>
                  <h3 className="text-lg font-black">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-500">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <div className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-slate-400">
              Co jest w systemie
            </div>
            <h2 className="text-3xl font-black tracking-tight md:text-5xl">
              Wszystko, czego hurtownia potrzebuje do startu sprzedaży B2B online.
            </h2>
            <p className="mt-5 text-sm leading-7 text-slate-500">
              Najpierw uruchamiamy praktyczny kanał zamówień. Potem dokładamy automatyzacje:
              importy, stany magazynowe, faktury, statusy i integracje z systemem klienta.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {included.map(item => (
              <div key={item} className="flex gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <div className="text-sm font-semibold leading-6 text-slate-700">{item}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="brand-gradient px-5 py-20 text-white lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-slate-400">
                Proponowany cennik
              </div>
              <h2 className="text-3xl font-black tracking-tight md:text-5xl">
                Stały abonament, bez prowizji od wartości zamówień.
              </h2>
              <p className="mt-5 text-sm leading-7 text-slate-300">
                Ceny netto. Przy płatności z góry: 6 miesięcy 10% taniej, 12 miesięcy w cenie 10.
                Wdrożenie jednorazowe od 1 490 zł netto, integracje ERP wyceniane po krótkiej analizie.
              </p>
            </div>
            <a
              href={contactHref}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5"
            >
              Zapytaj o wdrożenie
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {plans.map(plan => (
              <div
                key={plan.name}
                className={`rounded-lg border p-6 ${plan.featured ? 'border-[#27C7C3] bg-white text-slate-950 shadow-2xl shadow-slate-950/15' : 'border-white/10 bg-white/[0.06]'}`}
              >
                <div className={`mb-5 inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${plan.featured ? 'bg-[#E9FAF8] text-[#0F4D38]' : 'bg-white/10 text-slate-300'}`}>
                  {plan.badge}
                </div>
                <h3 className="text-2xl font-black">{plan.name}</h3>
                <div className="mt-5 flex items-end gap-2">
                  <div className="text-4xl font-black tracking-tight">{plan.price}</div>
                  <div className={`pb-1 text-sm font-bold ${plan.featured ? 'text-slate-500' : 'text-slate-400'}`}>
                    {plan.period}
                  </div>
                </div>
                <p className={`mt-4 text-sm leading-6 ${plan.featured ? 'text-slate-600' : 'text-slate-300'}`}>
                  {plan.description}
                </p>
                <div className="mt-6 space-y-3">
                  {plan.features.map(feature => (
                    <div key={feature} className="flex gap-2 text-sm font-semibold">
                      <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${plan.featured ? 'text-emerald-600' : 'text-emerald-300'}`} />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 lg:px-8">
        <div className="brand-gradient mx-auto max-w-7xl rounded-lg p-6 text-white md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-slate-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                Wdrożenie z operatorem
              </div>
              <h2 className="max-w-3xl text-3xl font-black tracking-tight md:text-5xl">
                Chcesz sprawdzić, czy Dostawio pasuje do Twojej hurtowni?
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
                Przejdziemy przez katalog, klientów, cenniki, formy płatności i system sprzedażowy.
                Po rozmowie dostaniesz prosty plan uruchomienia panelu B2B.
              </p>
            </div>
            <a
              href={contactHref}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-black text-[#303030] transition hover:-translate-y-0.5"
            >
              Umów konsultację
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
