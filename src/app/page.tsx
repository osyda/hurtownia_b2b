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
  Store,
  Users,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { DostawioLogo } from '@/components/brand/dostawio-logo'
import { DemoRequestForm } from '@/components/marketing/demo-request-form'
import { getTenantShopUrl, isPlatformMarketingHost } from '@/lib/shop-routing'

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
  const contactHref = 'mailto:kontakt@dostawio.pl?subject=Rozmowa%20o%20Dostawio%20Connect'

  const outcomes = [
    {
      icon: Clock3,
      title: 'Mniej telefonu i przepisywania',
      text: 'Klient B2B składa zamówienie sam, a hurtownia dostaje czytelną listę pozycji w panelu.',
    },
    {
      icon: CreditCard,
      title: 'Warunki per klient',
      text: 'Indywidualne ceny, grupy cenowe, minima zamówień i przypisane formy płatności.',
    },
    {
      icon: PlugZap,
      title: 'Gotowość pod integracje',
      text: 'Model danych jest przygotowany pod ERP, magazyn, faktury, statusy i synchronizację stanów.',
    },
  ]

  const flow = [
    ['Hurtownia dostaje swoją przestrzeń', 'np. twojahurtownia.dostawio.pl z panelem i sklepem B2B.'],
    ['Klient widzi swój katalog i cennik', 'Bez marketplace, bez obcych ofert, bez mieszania klientów.'],
    ['Zamówienie trafia do panelu', 'Z wartością, pozycjami, płatnością, adresem i historią klienta.'],
  ]

  const included = [
    'panel hurtowni i sklep klienta na subdomenie',
    'produkty, kategorie, importy i stany',
    'klienci B2B, grupy cenowe i indywidualne ceny',
    'formy płatności przypisywane do klienta',
    'koszyk, historia zamówień i e-maile',
    'API pod system sprzedażowy i magazynowy',
  ]

  const plans = [
    {
      name: 'Start',
      price: '399 zł',
      period: 'miesięcznie netto',
      badge: 'Dobry start',
      description: 'Dla hurtowni, która chce szybko uruchomić zamówienia online dla stałych klientów.',
      features: ['do 1 000 produktów', 'do 50 klientów B2B', 'katalog, koszyk i historia', 'podstawowy onboarding'],
    },
    {
      name: 'Pro',
      price: '699 zł',
      period: 'miesięcznie netto',
      badge: 'Najczęściej wybierany',
      description: 'Najlepszy plan do regularnej pracy B2B: większy katalog, importy, cenniki i obsługa handlowców.',
      features: ['do 10 000 produktów', 'do 250 klientów B2B', 'importy i grupy cenowe', 'priorytet wdrożenia'],
      featured: true,
    },
    {
      name: 'Integracje',
      price: 'od 1 190 zł',
      period: 'miesięcznie netto',
      badge: 'ERP i automatyzacje',
      description: 'Dla hurtowni, która chce połączyć Dostawio z systemem sprzedażowym, magazynem lub fakturami.',
      features: ['API integracyjne', 'statusy i faktury', 'synchronizacja stanów', 'indywidualny konektor'],
    },
  ]

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#FCFBF8] text-[#303030]">
      <header className="sticky top-0 z-40 border-b border-[#E8E4DC]/80 bg-white/90 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-5 lg:px-8">
          <DostawioLogo className="w-[166px] sm:w-[240px]" />
          <div className="hidden items-center gap-6 text-sm font-bold text-slate-600 md:flex">
            <a href="#oferta" className="transition hover:text-[#0F4D38]">Oferta</a>
            <a href="#jak-dziala" className="transition hover:text-[#0F4D38]">Jak działa</a>
            <a href="#cennik" className="transition hover:text-[#0F4D38]">Cennik</a>
          </div>
          <a href="#demo" className="brand-button shrink-0 px-3 py-2 text-xs sm:px-4 sm:text-sm">
            <span className="sm:hidden">Demo</span>
            <span className="hidden sm:inline">Poproś o demo</span>
          </a>
        </nav>
      </header>

      <section className="relative overflow-hidden px-5 py-14 lg:px-8 lg:py-20">
        <div className="absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(circle_at_80%_8%,rgba(39,199,195,0.13),transparent_30rem)]" />
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <div>
            <div className="mb-6 inline-flex max-w-full rounded-full border border-[#BFEDEA] bg-[#E9FAF8] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#0F4D38] sm:text-xs sm:tracking-[0.18em]">
              Platforma zamówień B2B dla hurtowni
            </div>
            <h1 className="max-w-4xl text-3xl font-black leading-[1.06] tracking-tight text-[#303030] sm:text-5xl lg:text-6xl">
              Własny panel zamówień online dla Twoich klientów B2B.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Dostawio Connect porządkuje codzienne zamówienia hurtowni: katalog, ceny, płatności,
              koszyk, historię i przygotowanie pod integracje z systemem sprzedażowo-magazynowym.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#demo" className="brand-button px-5 py-3 text-sm">
                Poproś o dostęp demo
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href={contactHref}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#E8E4DC] bg-white px-5 py-3 text-sm font-black text-[#303030] transition hover:border-[#27C7C3]"
              >
                Napisz do nas
              </a>
            </div>

            <div className="mt-9 grid gap-3 sm:grid-cols-3">
              {[
                ['Bez prowizji', 'abonament'],
                ['Subdomena', 'dla hurtowni'],
                ['Cenniki', 'per klient'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[#E8E4DC] bg-white px-4 py-3">
                  <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</div>
                  <div className="mt-1 text-sm font-black text-[#303030]">{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#E8E4DC] bg-white p-4 shadow-sm">
            <img
              src="/brand/dostawio-connect-logo-tagline.jpg"
              alt="Dostawio Connect - platforma zamówień B2B dla hurtowni"
              width={1280}
              height={427}
              className="mx-auto h-auto w-full max-w-xl rounded-md object-contain"
            />
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                { icon: Store, label: 'Hurtownia', value: 'własny adres' },
                { icon: Users, label: 'Klienci', value: 'swoje ceny' },
                { icon: ShoppingCart, label: 'Zamówienia', value: 'online' },
              ].map(item => (
                <div key={item.label} className="rounded-lg bg-[#FCFBF8] p-4">
                  <item.icon className="mb-4 h-5 w-5 text-[#0F4D38]" />
                  <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{item.label}</div>
                  <div className="mt-1 text-sm font-black">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="oferta" className="px-5 py-12 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <div className="text-sm font-black uppercase tracking-[0.18em] text-[#0F4D38]">Co dostaje hurtownia</div>
            <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-4xl">
              Lżejszy sposób przyjmowania zamówień od stałych klientów.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {outcomes.map(outcome => (
              <div key={outcome.title} className="rounded-lg border border-[#E8E4DC] bg-white p-5">
                <outcome.icon className="mb-6 h-6 w-6 text-[#0F4D38]" />
                <h3 className="text-lg font-black">{outcome.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-500">{outcome.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="jak-dziala" className="bg-white px-5 py-14 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <div className="text-sm font-black uppercase tracking-[0.18em] text-[#0F4D38]">Jak działa</div>
            <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-4xl">
              Klient zamawia na stronie swojej hurtowni, nie w cudzym marketplace.
            </h2>
            <p className="mt-5 text-sm leading-7 text-slate-500">
              To ma wyglądać jak kanał sprzedaży hurtowni: prosty, czytelny i przygotowany pod realny handel B2B.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {flow.map(([title, text], index) => (
              <div key={title} className="rounded-lg border border-[#E8E4DC] bg-[#FCFBF8] p-5">
                <div className="mb-5 flex h-8 w-8 items-center justify-center rounded-full bg-[#0F4D38] text-xs font-black text-white">
                  {index + 1}
                </div>
                <h3 className="text-base font-black">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-500">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-14 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <div className="text-sm font-black uppercase tracking-[0.18em] text-[#0F4D38]">Zakres systemu</div>
            <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-4xl">
              Najpierw zamówienia, potem automatyzacje.
            </h2>
            <p className="mt-5 text-sm leading-7 text-slate-500">
              Startujesz od działającego kanału zamówień online. Integracje z ERP, magazynem i fakturami można wdrażać etapami.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {included.map(item => (
              <div key={item} className="flex gap-3 rounded-lg border border-[#E8E4DC] bg-white px-4 py-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0F4D38]" />
                <div className="text-sm font-semibold leading-6 text-slate-700">{item}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cennik" className="bg-white px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <div className="text-sm font-black uppercase tracking-[0.18em] text-[#0F4D38]">Cennik</div>
              <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-4xl">
                Stały abonament bez prowizji od zamówień.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-500">
                Wdrożenie jednorazowe od 1 490 zł netto. Przy płatności rocznej: 2 miesiące w cenie.
                Integracje są wyceniane po krótkiej analizie systemu hurtowni.
              </p>
            </div>
            <div className="rounded-lg border border-[#BFEDEA] bg-[#E9FAF8] px-4 py-3 text-sm font-bold text-[#0F4D38]">
              Rekomendowany start: plan Pro
            </div>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-3 lg:items-stretch">
            {plans.map(plan => (
              <div
                key={plan.name}
                className={[
                  'relative flex flex-col rounded-lg border p-5 transition duration-200',
                  plan.featured
                    ? 'border-[#27C7C3] bg-white shadow-[0_18px_44px_rgba(15,77,56,0.14)] ring-1 ring-[#27C7C3]/25 lg:-mt-4 lg:pb-7'
                    : 'border-[#E8E4DC] bg-[#FCFBF8]',
                ].join(' ')}
              >
                {plan.featured && (
                  <div className="absolute -top-3 left-5 rounded-full bg-[#0F4D38] px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-white shadow-sm">
                    Najlepszy wybór
                  </div>
                )}

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className={plan.featured ? 'text-sm font-black uppercase tracking-[0.16em] text-[#0F4D38]' : 'text-sm font-black uppercase tracking-[0.16em] text-slate-400'}>
                      {plan.badge}
                    </div>
                    <h3 className="mt-2 text-2xl font-black">{plan.name}</h3>
                  </div>
                  {plan.featured && <PackageCheck className="h-6 w-6 text-[#27C7C3]" />}
                </div>

                <div className="mt-6">
                  <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
                    <div className={plan.featured ? 'text-4xl font-black tracking-tight text-[#303030]' : 'text-3xl font-black tracking-tight text-[#303030]'}>
                      {plan.price}
                    </div>
                    <div className="pb-1 text-sm font-bold text-slate-400">{plan.period}</div>
                  </div>
                  <p className="mt-4 min-h-[4.5rem] text-sm leading-6 text-slate-500">{plan.description}</p>
                </div>

                <div className="mt-5 space-y-3">
                  {plan.features.map(feature => (
                    <div key={feature} className="flex gap-2 text-sm font-semibold text-slate-700">
                      <CheckCircle2 className={plan.featured ? 'mt-0.5 h-4 w-4 shrink-0 text-[#0F4D38]' : 'mt-0.5 h-4 w-4 shrink-0 text-slate-400'} />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <a
                  href="#demo"
                  className={
                    plan.featured
                      ? 'brand-button mt-6 px-4 py-3 text-sm'
                      : 'mt-6 inline-flex items-center justify-center rounded-lg border border-[#E8E4DC] bg-white px-4 py-3 text-sm font-black text-[#303030] transition hover:border-[#27C7C3]'
                  }
                >
                  Poproś o demo
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-14 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="rounded-lg border border-[#E8E4DC] bg-white p-5">
            <ShieldCheck className="mb-5 h-6 w-6 text-[#0F4D38]" />
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Demo tylko po zgłoszeniu.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-500">
              Nie publikujemy danych testowego sklepu na stronie. Potencjalna hurtownia zostawia kontakt,
              a dostęp demo dostaje po krótkiej rozmowie.
            </p>
          </div>
          <DemoRequestForm />
        </div>
      </section>

      <footer className="border-t border-[#E8E4DC] bg-white px-5 py-8 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <DostawioLogo className="w-[180px]" />
          <a href={contactHref} className="text-sm font-bold text-[#0F4D38] hover:underline">
            kontakt@dostawio.pl
          </a>
        </div>
      </footer>
    </main>
  )
}
