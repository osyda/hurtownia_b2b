import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ShoppingCart, Users, Package, TrendingUp, Clock } from 'lucide-react'
import { formatCurrency, formatDateTime, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/utils'
import Link from 'next/link'

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

  const todayRevenue = todayOrders.data?.reduce((s, o) => s + (o.total_gross || 0), 0) ?? 0

  const cards = [
    { label: 'Zamówienia dziś', value: todayOrders.count ?? 0, sub: formatCurrency(todayRevenue), icon: ShoppingCart, color: 'text-blue-600 bg-blue-50' },
    { label: 'Nowe zamówienia', value: newOrders.count ?? 0, sub: 'oczekują na przyjęcie', icon: Clock, color: 'text-orange-600 bg-orange-50' },
    { label: 'Aktywni klienci', value: totalCustomers.count ?? 0, sub: null, icon: Users, color: 'text-green-600 bg-green-50' },
    { label: 'Aktywne produkty', value: totalProducts.count ?? 0, sub: null, icon: Package, color: 'text-purple-600 bg-purple-50' },
  ]

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {cards.map(card => (
          <div key={card.label} className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{card.label}</span>
              <div className={`p-2 rounded-lg ${card.color}`}>
                <card.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{card.value}</div>
            {card.sub && <div className="text-xs text-gray-400 mt-1">{card.sub}</div>}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border">
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Ostatnie zamówienia</h2>
          <Link
            href={`/${tenantSlug}/orders`}
            className="text-sm text-blue-600 hover:underline"
          >
            Wszystkie zamówienia
          </Link>
        </div>
        <div className="divide-y">
          {recentOrders.data?.map(order => {
            const customer = (order.customers as unknown as { company_name: string } | null)
            return (
              <Link
                key={order.id}
                href={`/${tenantSlug}/orders/${order.id}`}
                className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{order.order_number}</div>
                    <div className="text-xs text-gray-500">{customer?.company_name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${ORDER_STATUS_COLORS[order.status]}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(order.total_gross)}</div>
                    <div className="text-xs text-gray-400">{formatDateTime(order.created_at)}</div>
                  </div>
                </div>
              </Link>
            )
          })}
          {!recentOrders.data?.length && (
            <div className="p-8 text-center text-gray-400 text-sm">Brak zamówień</div>
          )}
        </div>
      </div>
    </div>
  )
}
