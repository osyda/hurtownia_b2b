import { createClient } from '@/lib/supabase/server'
import { Building2, Users, ShoppingCart, TrendingUp } from 'lucide-react'

async function getStats(supabase: Awaited<ReturnType<typeof createClient>>) {
  const [tenants, customers, orders] = await Promise.all([
    supabase.from('tenants').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('customers').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('orders').select('id, total_gross', { count: 'exact' })
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
  ])

  const totalRevenue = orders.data?.reduce((sum, o) => sum + (o.total_gross || 0), 0) ?? 0

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
    { label: 'Aktywne hurtownie', value: stats.activeTenants, icon: Building2, color: 'text-blue-600 bg-blue-50' },
    { label: 'Aktywni klienci', value: stats.activeCustomers, icon: Users, color: 'text-green-600 bg-green-50' },
    { label: 'Zamówienia (30 dni)', value: stats.ordersLast30Days, icon: ShoppingCart, color: 'text-orange-600 bg-orange-50' },
    {
      label: 'Obrót (30 dni)',
      value: new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(stats.revenueLast30Days),
      icon: TrendingUp,
      color: 'text-purple-600 bg-purple-50',
    },
  ]

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {cards.map(card => (
          <div key={card.label} className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{card.label}</span>
              <div className={cn('p-2 rounded-lg', card.color)}>
                <card.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border">
        <div className="p-5 border-b">
          <h2 className="font-semibold text-gray-900">Ostatnie zamówienia</h2>
        </div>
        <div className="divide-y">
          {recentOrders?.map(order => {
            const customer = (order.customers as unknown as { company_name: string } | null)
            const tenant = (order.tenants as unknown as { name: string } | null)
            return (
              <div key={order.id} className="p-4 flex items-center justify-between">
                <div>
                  <span className="font-medium text-sm text-gray-900">{order.order_number}</span>
                  <span className="text-gray-400 mx-2">·</span>
                  <span className="text-sm text-gray-600">{customer?.company_name}</span>
                  <span className="text-gray-400 mx-2">·</span>
                  <span className="text-xs text-gray-400">{tenant?.name}</span>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(order.total_gross)}
                </div>
              </div>
            )
          })}
          {!recentOrders?.length && (
            <div className="p-8 text-center text-gray-400 text-sm">Brak zamówień</div>
          )}
        </div>
      </div>
    </div>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}
