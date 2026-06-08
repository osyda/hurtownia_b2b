import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDateTime, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '@/lib/utils'
import { Building2, ChevronRight, ShoppingCart, Sparkles, TrendingUp, Users } from 'lucide-react'

async function getStats(supabase: Awaited<ReturnType<typeof createClient>>) {
  const [tenants, customers, orders] = await Promise.all([
    supabase.from('tenants').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('customers').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('orders').select('id, total_gross', { count: 'exact' })
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
  ])

  const totalRevenue = orders.data?.reduce((sum, order) => sum + (order.total_gross || 0), 0) ?? 0

  return {
    activeTenants: tenants.count ?? 0,
    activeCustomers: customers.count ?? 0,
    ordersLast30Days: orders.count ?? 0,
    revenueLast30Days: totalRevenue,
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

  return (
    <div className="space-y-7 p-4 md:p-8">
      <section className="premium-hero p-6 md:p-8">
        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="premium-pill mb-5">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              Super admin control room
            </div>
            <h1 className="text-3xl font-black tracking-tight md:text-5xl">
              Centrum dowodzenia hurtowniami B2B.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 md:text-base">
              Szybki podgląd aktywnych hurtowni, klientów, zamówień i obrotu z ostatnich 30 dni.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/10 p-4 text-right backdrop-blur">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Obrót 30 dni</div>
            <div className="mt-2 text-3xl font-black">{formatCurrency(stats.revenueLast30Days)}</div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
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
