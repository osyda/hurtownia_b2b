import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Clock, Package, ShoppingCart, Users } from 'lucide-react'
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
    { label: 'Zamowienia dzis', value: todayOrders.count ?? 0, sub: formatCurrency(todayRevenue), icon: ShoppingCart, color: 'text-sky-700 bg-sky-50' },
    { label: 'Nowe zamowienia', value: newOrders.count ?? 0, sub: 'oczekuja na przyjecie', icon: Clock, color: 'text-amber-700 bg-amber-50' },
    { label: 'Aktywni klienci', value: totalCustomers.count ?? 0, sub: null, icon: Users, color: 'text-emerald-700 bg-emerald-50' },
    { label: 'Aktywne produkty', value: totalProducts.count ?? 0, sub: null, icon: Package, color: 'text-slate-700 bg-slate-100' },
  ]

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Dzisiejsza sprzedaz, kolejka zamowien i kondycja katalogu.</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(card => (
          <div key={card.label} className="premium-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">{card.label}</span>
              <div className={`rounded-lg p-2 ${card.color}`}>
                <card.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-950">{card.value}</div>
            {card.sub && <div className="mt-1 text-xs font-medium text-slate-400">{card.sub}</div>}
          </div>
        ))}
      </div>

      <div className="premium-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200/80 p-5">
          <h2 className="font-semibold text-slate-950">Ostatnie zamowienia</h2>
          <Link href={`/${tenantSlug}/orders`} className="text-sm font-semibold text-slate-600 hover:text-slate-950">
            Wszystkie zamowienia
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {recentOrders.data?.map(order => {
            const customer = (order.customers as unknown as { company_name: string } | null)
            return (
              <Link
                key={order.id}
                href={`/${tenantSlug}/orders/${order.id}`}
                className="flex items-center justify-between p-4 transition hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <div className="font-mono text-sm font-semibold text-slate-950">{order.order_number}</div>
                  <div className="text-xs text-slate-500">{customer?.company_name}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${ORDER_STATUS_COLORS[order.status]}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-950">{formatCurrency(order.total_gross)}</div>
                    <div className="text-xs text-slate-400">{formatDateTime(order.created_at)}</div>
                  </div>
                </div>
              </Link>
            )
          })}
          {!recentOrders.data?.length && (
            <div className="p-8 text-center text-sm text-slate-400">Brak zamowien</div>
          )}
        </div>
      </div>
    </div>
  )
}
