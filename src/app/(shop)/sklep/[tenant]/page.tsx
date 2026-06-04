import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ShoppingCart, ClipboardList, RotateCcw, ChevronRight } from 'lucide-react'
import { formatCurrency, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/utils'

export default async function ShopDashboardPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: tenantSlug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: customer } = await supabase
    .from('customers')
    .select('id, company_name, tenants(customer_message, brand_color, name)')
    .eq('user_id', user.id)
    .single()

  if (!customer) redirect('/login')

  const tenantInfo = customer.tenants as unknown as { customer_message: string | null; brand_color: string; name: string } | null

  const { data: recentOrders } = await supabase
    .from('orders')
    .select('id, order_number, status, total_gross, created_at, delivery_date')
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: lastOrder } = await supabase
    .from('orders')
    .select('id, order_items(product_id, product_name, ordered_qty, product_unit)')
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const base = `/sklep/${tenantSlug}`

  return (
    <div className="space-y-6">
      {/* Powitanie */}
      <div className="bg-white rounded-xl border p-6">
        <h1 className="text-xl font-bold text-gray-900">Witaj, {customer.company_name}!</h1>
        {tenantInfo?.customer_message && (
          <p className="text-gray-600 mt-2 text-sm">{tenantInfo.customer_message}</p>
        )}
        <div className="mt-4">
          <Link
            href={`${base}/katalog`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-medium text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: tenantInfo?.brand_color ?? '#2563eb' }}
          >
            <ShoppingCart className="h-4 w-4" />
            Złóż zamówienie
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ostatnie zamówienia */}
        <div className="bg-white rounded-xl border">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Ostatnie zamówienia</h2>
            <Link href={`${base}/zamowienia`} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              Wszystkie <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y">
            {recentOrders?.length ? recentOrders.map(order => (
              <Link
                key={order.id}
                href={`${base}/zamowienia/${order.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <div className="font-medium text-sm text-gray-900 font-mono">{order.order_number}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{formatDate(order.created_at)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ORDER_STATUS_COLORS[order.status]}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(order.total_gross)}</span>
                </div>
              </Link>
            )) : (
              <div className="p-8 text-center text-gray-400 text-sm">Brak zamówień</div>
            )}
          </div>
        </div>

        {/* Szybkie akcje */}
        <div className="space-y-4">
          <Link
            href={`${base}/katalog`}
            className="flex items-center gap-4 bg-white rounded-xl border p-4 hover:border-blue-300 hover:shadow-sm transition-all group"
          >
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">Przeglądaj produkty</div>
              <div className="text-sm text-gray-500">Znajdź i dodaj produkty do koszyka</div>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400 ml-auto" />
          </Link>

          <Link
            href={`${base}/zamowienia`}
            className="flex items-center gap-4 bg-white rounded-xl border p-4 hover:border-blue-300 hover:shadow-sm transition-all group"
          >
            <div className="p-3 rounded-xl bg-green-50 text-green-600 group-hover:bg-green-100 transition-colors">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">Historia zamówień</div>
              <div className="text-sm text-gray-500">Przeglądaj swoje poprzednie zamówienia</div>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400 ml-auto" />
          </Link>

          {lastOrder && (
            <Link
              href={`${base}/zamowienia/${lastOrder.id}?reorder=1`}
              className="flex items-center gap-4 bg-white rounded-xl border p-4 hover:border-blue-300 hover:shadow-sm transition-all group"
            >
              <div className="p-3 rounded-xl bg-orange-50 text-orange-600 group-hover:bg-orange-100 transition-colors">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Zamów ponownie</div>
                <div className="text-sm text-gray-500">Powtórz ostatnie zamówienie</div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 ml-auto" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
