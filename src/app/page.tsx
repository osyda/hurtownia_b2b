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
  const contactHref = 'mailto:kontakt@dostawio.pl?subject=Rozmowa%20o%20Dostawio'

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
    <main className="min-h-screen overflow-x-hidden bg-[#FBFAF7] text-[#1D2125]">
      <header className="sticky top-0 z-40 border-b border-[#E2DCD0]/80 bg-white/90 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-5 lg:px-8">
          <DostawioLogo className="w-[166px] sm:w-[240px]" />
          <div className="hidden items-center gap-6 text-sm font-bold text-slate-600 md:flex">
            <a href="#oferta" className="transition hover:text-[#1D2125]">Oferta</a>
            <a href="#jak-dziala" className="transition hover:text-[#1D2125]">Jak działa</a>
            <a href="#cennik" className="transition hover:text-[#1D2125]">Cennik</a>
          </div>
          <a href="#demo" className="brand-button shrink-0 px-3 py-2 text-xs sm:px-4 sm:text-sm">
            <span className="sm:hidden">Demo</span>
            <span className="hidden sm:inline">Poproś o demo</span>
          </a>
        </nav>
      </header>

      <section className="relative overflow-hidden px-5 py-14 lg:px-8 lg:py-20">
        <div className="absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(circle_at_82%_6%,rgba(224,138,43,0.14),transparent_30rem)]" />
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <div>
            <div className="mb-6 inline-flex max-w-full rounded-full border border-[#F0D3B3] bg-[#FFF7ED] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#1D2125] sm:text-xs sm:tracking-[0.18em]">
              Platforma zamówień B2B dla hurtowni
            </div>
            <h1 className="max-w-4xl text-3xl font-black leading-[1.06] tracking-tight text-[#1D2125] sm:text-5xl lg:text-6xl">
              Własny panel zamówień online dla Twoich klientów B2B.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Dostawio porządkuje codzienne zamówienia hurtowni: katalog, ceny, płatności,
              koszyk, historię i przygotowanie pod integracje z systemem sprzedażowo-magazynowym.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#demo" className="brand-button px-5 py-3 text-sm">
                Poproś o dostęp demo
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href={contactHref}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#E2DCD0] bg-white px-5 py-3 text-sm font-black text-[#1D2125] transition hover:border-[#E08A2B]"
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
                <div key={label} className="rounded-lg border border-[#E2DCD0] bg-white px-4 py-3">
                  <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</div>
                  <div className="mt-1 text-sm font-black text-[#1D2125]">{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#1D2125] bg-[#16191C] p-5 text-white shadow-[0_18px_42px_rgba(29,33,37,0.12)]">
            <div className="rounded-lg bg-[#1D2125] px-5 py-8">
              <DostawioLogo light className="mx-auto w-full max-w-xl" />
              <p className="mx-auto mt-6 max-w-md text-center text-sm font-semibold leading-6 text-white/62">
                Własny kanał zamówień B2B dla hurtowni, bez prowizji od sprzedaży i bez publicznego marketplace.
              </p>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                { icon: Store, label: 'Hurtownia', value: 'własny adres' },
                { icon: Users, label: 'Klienci', value: 'swoje ceny' },
                { icon: ShoppingCart, label: 'Zamówienia', value: 'online' },
              ].map(item => (
                <div key={item.label} className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
                  <item.icon className="mb-4 h-5 w-5 text-[#E08A2B]" />
                  <div className="text-xs font-black uppercase tracking-[0.14em] text-white/45">{item.label}</div>
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
            <div className="text-sm font-black uppercase tracking-[0.18em] text-[#1D2125]">Co dostaje hurtownia</div>
            <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-4xl">
              Lżejszy sposób przyjmowania zamówień od stałych klientów.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {outcomes.map(outcome => (
              <div key={outcome.title} className="rounded-lg border border-[#E2DCD0] bg-white p-5">
                <outcome.icon className="mb-6 h-6 w-6 text-[#1D2125]" />
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
            <div className="text-sm font-black uppercase tracking-[0.18em] text-[#1D2125]">Jak działa</div>
            <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-4xl">
              Klient zamawia na stronie swojej hurtowni, nie w cudzym marketplace.
            </h2>
            <p className="mt-5 text-sm leading-7 text-slate-500">
              To ma wyglądać jak kanał sprzedaży hurtowni: prosty, czytelny i przygotowany pod realny handel B2B.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {flow.map(([title, text], index) => (
              <div key={title} className="rounded-lg border border-[#E2DCD0] bg-[#FBFAF7] p-5">
                <div className="mb-5 flex h-8 w-8 items-center justify-center rounded-full bg-[#1D2125] text-xs font-black text-white">
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
            <div className="text-sm font-black uppercase tracking-[0.18em] text-[#1D2125]">Zakres systemu</div>
            <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-4xl">
              Najpierw zamówienia, potem automatyzacje.
            </h2>
            <p className="mt-5 text-sm leading-7 text-slate-500">
              Startujesz od działającego kanału zamówień online. Integracje z ERP, magazynem i fakturami można wdrażać etapami.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {included.map(item => (
              <div key={item} className="flex gap-3 rounded-lg border border-[#E2DCD0] bg-white px-4 py-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1D2125]" />
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
              <div className="text-sm font-black uppercase tracking-[0.18em] text-[#1D2125]">Cennik</div>
              <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-4xl">
                Stały abonament, jasny zakres i bez prowizji od zamówień.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-500">
                Wdrożenie jednorazowe od 1 490 zł netto. Przy płatności rocznej: 2 miesiące w cenie.
                Integracje są wyceniane po krótkiej analizie systemu hurtowni.
              </p>
            </div>
            <div className="rounded-lg border border-[#F0D3B3] bg-[#FFF7ED] px-4 py-3 text-sm font-bold text-[#1D2125]">
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
                    ? 'border-[#1D2125] bg-[#1D2125] text-white shadow-[0_22px_52px_rgba(29,33,37,0.18)] ring-1 ring-[#E08A2B]/45 lg:-mt-5 lg:pb-8'
                    : 'border-[#E2DCD0] bg-[#FBFAF7]',
                ].join(' ')}
              >
                {plan.featured && (
                  <div className="absolute -top-3 left-5 rounded-full bg-[#E08A2B] px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-white shadow-sm">
                    Najlepszy wybór
                  </div>
                )}

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className={plan.featured ? 'text-sm font-black uppercase tracking-[0.16em] text-[#E08A2B]' : 'text-sm font-black uppercase tracking-[0.16em] text-slate-400'}>
                      {plan.badge}
                    </div>
                    <h3 className="mt-2 text-2xl font-black">{plan.name}</h3>
                  </div>
                  {plan.featured && <PackageCheck className="h-6 w-6 text-[#E08A2B]" />}
                </div>

                <div className="mt-6">
                  <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
                    <div className={plan.featured ? 'text-4xl font-black tracking-tight text-white' : 'text-3xl font-black tracking-tight text-[#1D2125]'}>
                      {plan.price}
                    </div>
                    <div className={plan.featured ? 'pb-1 text-sm font-bold text-white/52' : 'pb-1 text-sm font-bold text-slate-400'}>{plan.period}</div>
                  </div>
                  <p className={plan.featured ? 'mt-4 min-h-[4.5rem] text-sm leading-6 text-white/62' : 'mt-4 min-h-[4.5rem] text-sm leading-6 text-slate-500'}>{plan.description}</p>
                </div>

                <div className="mt-5 space-y-3">
                  {plan.features.map(feature => (
                    <div key={feature} className={plan.featured ? 'flex gap-2 text-sm font-semibold text-white/78' : 'flex gap-2 text-sm font-semibold text-slate-700'}>
                      <CheckCircle2 className={plan.featured ? 'mt-0.5 h-4 w-4 shrink-0 text-[#E08A2B]' : 'mt-0.5 h-4 w-4 shrink-0 text-slate-400'} />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <a
                  href="#demo"
                  className={
                    plan.featured
                      ? 'mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-[#E08A2B] px-4 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#C7741F]'
                      : 'mt-6 inline-flex items-center justify-center rounded-lg border border-[#E2DCD0] bg-white px-4 py-3 text-sm font-black text-[#1D2125] transition hover:border-[#E08A2B]'
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
          <div className="rounded-lg border border-[#E2DCD0] bg-white p-5">
            <ShieldCheck className="mb-5 h-6 w-6 text-[#1D2125]" />
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Demo tylko po zgłoszeniu.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-500">
              Nie publikujemy danych testowego sklepu na stronie. Potencjalna hurtownia zostawia kontakt,
              a dostęp demo dostaje po krótkiej rozmowie.
            </p>
          </div>
          <DemoRequestForm />
        </div>
      </section>

      <footer className="border-t border-[#E2DCD0] bg-white px-5 py-8 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <DostawioLogo className="w-[180px]" />
          <div className="flex flex-col gap-2 text-sm font-semibold text-slate-600 sm:flex-row sm:items-center sm:gap-5">
            <a href="/polityka-prywatnosci" className="hover:text-[#1D2125] hover:underline">Polityka prywatności</a>
            <a href="/regulamin" className="hover:text-[#1D2125] hover:underline">Regulamin</a>
            <a href={contactHref} className="text-[#1D2125] hover:underline">kontakt@dostawio.pl</a>
          </div>
        </div>
      </footer>
    </main>
  )
}
