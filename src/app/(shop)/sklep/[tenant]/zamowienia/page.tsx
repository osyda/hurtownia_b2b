import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { ClipboardList, ChevronRight } from 'lucide-react'
import { getShopBasePath } from '@/lib/shop-routing'
import { formatCurrency, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/utils'
import { ReorderButton, type ReorderOrderItem } from '@/components/shop/reorder-button'

export default async function OrderHistoryPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: tenantSlug } = await params
  const shopBasePath = getShopBasePath(tenantSlug, (await headers()).get('host'))
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: customer } = await supabase
    .from('customers')
    .select('id, tenants!inner(brand_color)')
    .eq('user_id', user.id)
    .single()

  if (!customer) redirect('/login')
  const brandColor = (customer.tenants as unknown as { brand_color: string }).brand_color

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      status,
      total_gross,
      created_at,
      delivery_date,
      payment_methods(label),
      order_items(
        product_id,
        product_name,
        product_sku,
        product_unit,
        ordered_qty,
        unit_price_net,
        vat_rate,
        line_total_net,
        products(id, name, sku, unit, base_price, vat_rate, min_order_qty, order_multiple, stock_status, status)
      )
    `)
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Moje zamówienia</h1>

      {orders?.length ? (
        <div className="space-y-3">
          {orders.map(order => {
            const pm = order.payment_methods as unknown as { label: string } | null
            const items = (order.order_items ?? []) as unknown as ReorderOrderItem[]
            const canReorder = order.status === 'delivered' && items.length > 0

            return (
              <div
                key={order.id}
                className="premium-card flex flex-col gap-3 p-4 transition-all hover:border-[#E08A2B] hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <Link href={`${shopBasePath}/zamowienia/${order.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <ClipboardList className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-mono font-semibold text-gray-900">{order.order_number}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{formatDate(order.created_at)}{order.delivery_date ? ` · dostawa ${order.delivery_date}` : ''}</div>
                    {pm && <div className="text-xs text-gray-400">{pm.label}</div>}
                  </div>
                </Link>
                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{formatCurrency(order.total_gross)}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ORDER_STATUS_COLORS[order.status]}`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>
                  {canReorder ? (
                    <ReorderButton
                      brandColor={brandColor}
                      items={items}
                      shopBasePath={shopBasePath}
                      variant="compact"
                    />
                  ) : (
                    <Link href={`${shopBasePath}/zamowienia/${order.id}`} className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-50 hover:text-gray-700">
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </div>
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
