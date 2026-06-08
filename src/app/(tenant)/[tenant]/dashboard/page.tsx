import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Clock, Package, ShoppingCart, Sparkles, TrendingUp, Users } from 'lucide-react'
import { formatCurrency, formatDateTime, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '@/lib/utils'

export default async function TenantDashboardPage({
  params,
}: {
  params: Promise<{ tenant: string }>
}) {
  const { tenant: tenantSlug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) redirect('/login')
  const tenantId = profile.tenant_id

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [todayOrders, totalCustomers, totalProducts, newOrders, recentOrders] = await Promise.all([
    supabase.from('orders').select('id, total_gross', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .gte('created_at', today.toISOString()),
    supabase.from('customers').select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId).eq('status', 'active'),
    supabase.from('products').select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId).eq('status', 'active'),
    supabase.from('orders').select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId).eq('status', 'new'),
    supabase.from('orders')
      .select('id, order_number, status, total_gross, created_at, customers(company_name)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const todayRevenue = todayOrders.data?.reduce((sum, order) => sum + (order.total_gross || 0), 0) ?? 0

  const cards = [
    { label: 'Zamówienia dziś', value: todayOrders.count ?? 0, sub: formatCurrency(todayRevenue), icon: ShoppingCart, accent: 'from-sky-500 to-cyan-400' },
    { label: 'Nowe zamówienia', value: newOrders.count ?? 0, sub: 'do obsługi', icon: Clock, accent: 'from-amber-500 to-orange-400' },
    { label: 'Aktywni klienci', value: totalCustomers.count ?? 0, sub: 'kupujący B2B', icon: Users, accent: 'from-emerald-500 to-teal-400' },
    { label: 'Aktywne produkty', value: totalProducts.count ?? 0, sub: 'w katalogu', icon: Package, accent: 'from-slate-700 to-slate-500' },
  ]

  return (
    <div className="space-y-7 p-4 md:p-8">
      <section className="premium-hero p-6 md:p-8">
        <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_320px] lg:items-end">
          <div>
            <div className="premium-pill mb-5">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              Dzisiejszy pulpit sprzedaży
            </div>
            <h1 className="text-3xl font-black tracking-tight md:text-5xl">
              Zamówienia, klienci i katalog pod pełną kontrolą.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
              Monitoruj kolejkę zamówień, obrót dnia i aktywność klientów bez przeklikiwania się przez raporty.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/10 p-5 backdrop-blur">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Sprzedaż dziś</div>
            <div className="mt-2 text-4xl font-black">{formatCurrency(todayRevenue)}</div>
            <div className="mt-2 text-sm text-slate-300">{todayOrders.count ?? 0} zamówień od północy</div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(card => (
          <div key={card.label} className="premium-stat-card">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <div className="text-sm font-bold uppercase tracking-[0.14em] text-slate-400">{card.label}</div>
                <div className="mt-2 text-3xl font-black tracking-tight text-slate-950">{card.value}</div>
              </div>
              <div className={`rounded-lg bg-gradient-to-br ${card.accent} p-2.5 text-white shadow-lg shadow-slate-900/10`}>
                <card.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-bold text-slate-600">{card.sub}</div>
          </div>
        ))}
      </div>

      <section className="premium-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200/80 bg-white px-5 py-4">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-950">Ostatnie zamówienia</h2>
            <p className="text-sm text-slate-500">Najnowsze zamówienia klientów i ich status.</p>
          </div>
          <Link href={`/${tenantSlug}/orders`} className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-bold text-white transition hover:bg-slate-800">
            Wszystkie
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {recentOrders.data?.map(order => {
            const customer = (order.customers as unknown as { company_name: string } | null)
            return (
              <Link
                key={order.id}
                href={`/${tenantSlug}/orders/${order.id}`}
                className="premium-table-row grid gap-3 p-4 md:grid-cols-[1fr_auto_auto] md:items-center"
              >
                <div className="min-w-0">
                  <div className="font-mono text-sm font-black text-slate-950">{order.order_number}</div>
                  <div className="mt-1 truncate text-sm text-slate-500">{customer?.company_name}</div>
                </div>
                <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-bold ${ORDER_STATUS_COLORS[order.status]}`}>
                  {ORDER_STATUS_LABELS[order.status]}
                </span>
                <div className="text-left md:text-right">
                  <div className="text-sm font-black text-slate-950">{formatCurrency(order.total_gross)}</div>
                  <div className="text-xs text-slate-400">{formatDateTime(order.created_at)}</div>
                </div>
              </Link>
            )
          })}
          {!recentOrders.data?.length && (
            <div className="p-10 text-center text-sm text-slate-400">Brak zamówień</div>
          )}
        </div>
      </section>
    </div>
  )
}
