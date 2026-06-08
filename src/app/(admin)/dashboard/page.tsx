import { createClient } from '@/lib/supabase/server'
import { Building2, ShoppingCart, TrendingUp, Users } from 'lucide-react'

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
    { label: 'Aktywne hurtownie', value: stats.activeTenants, icon: Building2, color: 'text-sky-700 bg-sky-50' },
    { label: 'Aktywni klienci', value: stats.activeCustomers, icon: Users, color: 'text-emerald-700 bg-emerald-50' },
    { label: 'Zamowienia (30 dni)', value: stats.ordersLast30Days, icon: ShoppingCart, color: 'text-amber-700 bg-amber-50' },
    {
      label: 'Obrot (30 dni)',
      value: new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(stats.revenueLast30Days),
      icon: TrendingUp,
      color: 'text-slate-700 bg-slate-100',
    },
  ]

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Centralny pulpit kontroli hurtowni i zamowien B2B.</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {cards.map(card => (
          <div key={card.label} className="premium-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">{card.label}</span>
              <div className={cn('rounded-lg p-2', card.color)}>
                <card.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-950">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="premium-card overflow-hidden">
        <div className="border-b border-slate-200/80 p-5">
          <h2 className="font-semibold text-slate-950">Ostatnie zamowienia</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {recentOrders?.map(order => {
            const customer = (order.customers as unknown as { company_name: string } | null)
            const tenant = (order.tenants as unknown as { name: string } | null)
            return (
              <div key={order.id} className="flex items-center justify-between p-4 transition hover:bg-slate-50">
                <div className="min-w-0">
                  <span className="font-mono text-sm font-semibold text-slate-950">{order.order_number}</span>
                  <span className="mx-2 text-slate-300">·</span>
                  <span className="text-sm text-slate-600">{customer?.company_name}</span>
                  <span className="mx-2 text-slate-300">·</span>
                  <span className="text-xs text-slate-400">{tenant?.name}</span>
                </div>
                <div className="text-sm font-semibold text-slate-950">
                  {new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(order.total_gross)}
                </div>
              </div>
            )
          })}
          {!recentOrders?.length && (
            <div className="p-8 text-center text-sm text-slate-400">Brak zamowien</div>
          )}
        </div>
      </div>
    </div>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}
