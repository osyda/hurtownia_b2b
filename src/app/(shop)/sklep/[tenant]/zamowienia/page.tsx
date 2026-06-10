import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { ClipboardList, ChevronRight } from 'lucide-react'
import { getShopBasePath } from '@/lib/shop-routing'
import { formatCurrency, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/utils'

export default async function OrderHistoryPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: tenantSlug } = await params
  const shopBasePath = getShopBasePath(tenantSlug, (await headers()).get('host'))
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!customer) redirect('/login')

  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, status, total_gross, created_at, delivery_date, payment_methods(label)')
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Moje zamówienia</h1>

      {orders?.length ? (
        <div className="space-y-3">
          {orders.map(order => {
            const pm = order.payment_methods as unknown as { label: string } | null
            return (
              <Link
                key={order.id}
                href={`${shopBasePath}/zamowienia/${order.id}`}
                className="flex items-center justify-between premium-card p-4 hover:border-[#E08A2B] hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <ClipboardList className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <div className="font-mono font-semibold text-gray-900">{order.order_number}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{formatDate(order.created_at)}{order.delivery_date ? ` · dostawa ${order.delivery_date}` : ''}</div>
                    {pm && <div className="text-xs text-gray-400">{pm.label}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{formatCurrency(order.total_gross)}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ORDER_STATUS_COLORS[order.status]}`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="premium-card p-16 text-center">
          <ClipboardList className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Brak zamówień</p>
          <p className="text-gray-400 text-sm mt-1">Twoje zamówienia pojawią się tutaj</p>
          <Link href={`${shopBasePath}/katalog`} className="inline-block mt-4 text-sm text-[#1D2125] hover:underline">
            Przejdź do katalogu →
          </Link>
        </div>
      )}
    </div>
  )
}
