import Link from 'next/link'
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FileText,
  Globe2,
  Gauge,
  ShoppingCart,
  Sparkles,
  Store,
  TrendingUp,
  Users,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { buildTenantOnboarding } from '@/lib/onboarding'
import { formatCurrency, formatDateTime, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '@/lib/utils'

function relationCount(value: unknown) {
  return (value as { count: number }[] | null)?.[0]?.count ?? 0
}

async function getStats(supabase: Awaited<ReturnType<typeof createClient>>) {
  const [tenants, customers, orders, tenantReadiness] = await Promise.all([
    supabase.from('tenants').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('customers').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('orders').select('id, total_gross', { count: 'exact' })
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from('tenants').select(`
      id, name, slug, contact_email, contact_phone, brand_color,
      customers(count),
      categories(count),
      products(count),
      payment_methods(count),
      price_groups(count),
      tenant_integrations(count),
      orders(count),
      delivery_settings(count)
    `),
  ])

  const totalRevenue = orders.data?.reduce((sum, order) => sum + (order.total_gross || 0), 0) ?? 0
  const readinessStates = (tenantReadiness.data ?? []).map(tenant =>
    buildTenantOnboarding({
      tenant,
      counts: {
        categories: relationCount(tenant.categories),
        products: relationCount(tenant.products),
        customers: relationCount(tenant.customers),
        paymentMethods: relationCount(tenant.payment_methods),
        priceGroups: relationCount(tenant.price_groups),
        integrations: relationCount(tenant.tenant_integrations),
        orders: relationCount(tenant.orders),
      },
      hasDeliverySettings: relationCount(tenant.delivery_settings) > 0,
    }, tenant.slug)
  )
  const averageReadiness = readinessStates.length
    ? Math.round(readinessStates.reduce((sum, state) => sum + state.score, 0) / readinessStates.length)
    : 0
  const operationalTenants = readinessStates.filter(state => state.score >= 70).length

  return {
    activeTenants: tenants.count ?? 0,
    activeCustomers: customers.count ?? 0,
    ordersLast30Days: orders.count ?? 0,
    revenueLast30Days: totalRevenue,
    averageReadiness,
    operationalTenants,
  }
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const stats = await getStats(supabase)

  const { data: recentOrders } = await supabase
    .from('orders')
    .select('id, order_number, status, total_gross, created_at, customers(company_name), tenants(name)')
    .order('created_at', { ascending: false })
    .limit(10)

  const cards = [
    { label: 'Aktywne hurtownie', value: stats.activeTenants, detail: 'działające konta', icon: Building2, accent: 'from-sky-500 to-cyan-400' },
    { label: 'Gotowość platformy', value: `${stats.averageReadiness}%`, detail: `${stats.operationalTenants} hurtowni operacyjnie`, icon: Gauge, accent: 'from-violet-500 to-sky-500' },
    { label: 'Aktywni klienci', value: stats.activeCustomers, detail: 'z dostępem B2B', icon: Users, accent: 'from-emerald-500 to-teal-400' },
    { label: 'Zamówienia 30 dni', value: stats.ordersLast30Days, detail: 'ostatni miesiąc', icon: ShoppingCart, accent: 'from-amber-500 to-orange-400' },
    {
      label: 'Obrót 30 dni',
      value: formatCurrency(stats.revenueLast30Days),
      detail: 'wartość brutto',
      icon: TrendingUp,
      accent: 'from-slate-700 to-slate-500',
    },
  ]
  const offerNotes = [
    {
      icon: Globe2,
      title: 'Strona publiczna',
      value: 'dostawio.pl',
      text: 'Sprzedaje korzyści dla hurtowni: mniej telefonu, własny panel B2B, klienci zamawiają online.',
    },
    {
      icon: Store,
      title: 'Adres hurtowni',
      value: 'slug.dostawio.pl',
      text: 'To jest miejsce pracy hurtowni i jej klientów. Nie komunikuj klientowi końcowemu app ani superadmina.',
    },
    {
      icon: CreditCard,
      title: 'Model ceny',
      value: 'abonament + wdrożenie',
      text: 'Startuj od stałego abonamentu bez prowizji od wartości zamówień. Integracje wyceniaj osobno.',
    },
  ]
  const internalPricing = [
    ['Start B2B', '399 zł/mies.', '6 mies. 2 154 zł, rok 3 990 zł netto'],
    ['Pro B2B', '699 zł/mies.', 'dla hurtowni z większym katalogiem i importami'],
    ['Integracje', '1 190 zł/mies.', 'ERP, faktury, stany, statusy i indywidualny konektor'],
  ]
  const launchSteps = [
    'Utwórz hurtownię i administratora.',
    'Ustaw dane firmy, płatności, dostawy i minimum zamówienia.',
    'Zaimportuj kategorie oraz produkty z SKU.',
    'Dodaj klienta B2B, grupę cenową i przypisane formy płatności.',
    'Wyślij dostęp do subdomeny hurtowni.',
    'Zrób testowe zamówienie i dopiero wtedy uruchom klienta.',
  ]

  return (
    <div className="space-y-7 p-4 md:p-8">
      <section className="premium-hero p-6 md:p-8">
        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="premium-pill mb-5">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              Superadmin Dostawio
            </div>
            <h1 className="text-3xl font-black tracking-tight md:text-5xl">
              Centrum dowodzenia platformą B2B.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 md:text-base">
              Podgląd hurtowni, klientów, zamówień, obrotu i gotowości wdrożeniowej całej platformy.
            </p>
          </div>
          <Link
            href="/platform"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-sm font-black text-white transition hover:bg-white hover:text-slate-950"
          >
            <Globe2 className="h-4 w-4" />
            Konfiguracja platformy
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {cards.map(card => (
          <div key={card.label} className="premium-stat-card overflow-hidden">
            <div className="mb-5 flex items-center justify-between">
              <div className={`rounded-lg bg-gradient-to-br ${card.accent} p-2.5 text-white shadow-lg shadow-slate-900/10`}>
                <card.icon className="h-5 w-5" />
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </div>
            <div className="text-sm font-bold uppercase tracking-[0.14em] text-slate-400">{card.label}</div>
            <div className="mt-2 text-3xl font-black tracking-tight text-slate-950">{card.value}</div>
            <div className="mt-2 text-sm font-medium text-slate-500">{card.detail}</div>
          </div>
        ))}
      </div>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="premium-card overflow-hidden">
          <div className="border-b border-slate-200/80 bg-white px-5 py-4">
            <h2 className="text-lg font-black tracking-tight text-slate-950">Wewnętrzny playbook sprzedaży</h2>
            <p className="mt-1 text-sm text-slate-500">
              Te informacje są dla Ciebie po zalogowaniu. Na stronie publicznej pokazujemy tylko wartość dla hurtowni.
            </p>
          </div>
          <div className="grid gap-4 p-5 lg:grid-cols-3">
            {offerNotes.map(note => (
              <div key={note.title} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <note.icon className="mb-4 h-5 w-5 text-slate-500" />
                <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{note.title}</div>
                <div className="mt-2 font-mono text-sm font-black text-slate-950">{note.value}</div>
                <p className="mt-3 text-sm leading-6 text-slate-500">{note.text}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-200/80 p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-black text-slate-950">
              <FileText className="h-4 w-4 text-slate-500" />
              Kroki wdrożenia hurtowni
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {launchSteps.map(step => (
                <div key={step} className="flex gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="premium-card overflow-hidden">
          <div className="border-b border-slate-200/80 bg-slate-950 px-5 py-4 text-white">
            <h2 className="text-lg font-black tracking-tight">Proponowany cennik do rozmów</h2>
            <p className="mt-1 text-sm text-slate-400">Ceny netto. Wdrożenie jednorazowe od 1 490 zł.</p>
          </div>
          <div className="divide-y divide-slate-100">
            {internalPricing.map(([name, price, detail]) => (
              <div key={name} className="grid gap-3 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <div className="font-black text-slate-950">{name}</div>
                  <div className="mt-1 text-sm leading-6 text-slate-500">{detail}</div>
                </div>
                <div className="rounded-lg bg-slate-50 px-3 py-2 text-right font-black text-slate-950">
                  {price}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-200/80 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
            Roczny plan sprzedawaj jako najkorzystniejszy: 12 miesięcy w cenie 10. Integracje ERP/WMS traktuj
            jako osobny etap po uruchomieniu podstawowego zamawiania.
          </div>
        </div>
      </section>

      <section className="premium-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200/80 bg-white px-5 py-4">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-950">Ostatnie zamówienia</h2>
            <p className="text-sm text-slate-500">Najnowsza aktywność ze wszystkich hurtowni.</p>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {recentOrders?.map(order => {
            const customer = (order.customers as unknown as { company_name: string } | null)
            const tenant = (order.tenants as unknown as { name: string } | null)

            return (
              <div key={order.id} className="premium-table-row grid gap-3 p-4 md:grid-cols-[1.2fr_1fr_auto] md:items-center">
                <div className="min-w-0">
                  <div className="font-mono text-sm font-black text-slate-950">{order.order_number}</div>
                  <div className="mt-1 truncate text-sm text-slate-500">{customer?.company_name ?? 'Klient'}</div>
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-700">{tenant?.name ?? 'Hurtownia'}</div>
                  <div className="mt-1 text-xs text-slate-400">{formatDateTime(order.created_at)}</div>
                </div>
                <div className="flex items-center justify-between gap-4 md:justify-end">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${ORDER_STATUS_COLORS[order.status]}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                  <div className="text-right text-sm font-black text-slate-950">
                    {formatCurrency(order.total_gross)}
                  </div>
                </div>
              </div>
            )
          })}
          {!recentOrders?.length && (
            <div className="p-10 text-center text-sm text-slate-400">Brak zamówień</div>
          )}
        </div>
      </section>
    </div>
  )
}
