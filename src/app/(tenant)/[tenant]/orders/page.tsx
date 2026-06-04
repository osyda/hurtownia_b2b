import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Search, ShoppingCart } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDateTime, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/utils'

export default async function OrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  const { tenant: tenantSlug } = await params
  const { q, status } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('user_profiles').select('tenant_id').eq('id', user.id).single()
  if (!profile?.tenant_id) redirect('/login')

  let query = supabase.from('orders')
    .select('id, order_number, status, total_gross, delivery_date, created_at, customers(company_name)')
    .eq('tenant_id', profile.tenant_id)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data: orders } = await query

  const filteredOrders = q
    ? orders?.filter(o => {
        const customer = o.customers as unknown as { company_name: string } | null
        return o.order_number.toLowerCase().includes(q.toLowerCase()) ||
          customer?.company_name.toLowerCase().includes(q.toLowerCase())
      })
    : orders

  return (
    <div className="p-8">
      <PageHeader title="Zamówienia" description={`${filteredOrders?.length ?? 0} zamówień`} />

      <form className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input name="q" defaultValue={q} placeholder="Szukaj zamówienia lub klienta..." className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select name="status" defaultValue={status} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Wszystkie statusy</option>
          {Object.entries(ORDER_STATUS_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <button type="submit" className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors">Filtruj</button>
      </form>

      <div className="bg-white rounded-xl border overflow-hidden">
        {filteredOrders?.length ? (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Nr zamówienia</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Klient</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Data złożenia</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Dostawa</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Wartość</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredOrders.map(order => {
                const customer = order.customers as unknown as { company_name: string } | null
                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm font-medium text-gray-900">{order.order_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{customer?.company_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDateTime(order.created_at)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{order.delivery_date || '—'}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">{formatCurrency(order.total_gross)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${ORDER_STATUS_COLORS[order.status]}`}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/${tenantSlug}/orders/${order.id}`} className="text-sm text-blue-600 hover:underline">Szczegóły</Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-16 text-center">
            <ShoppingCart className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Brak zamówień</p>
          </div>
        )}
      </div>
    </div>
  )
}
