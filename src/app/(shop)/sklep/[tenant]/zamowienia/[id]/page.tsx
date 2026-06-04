import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDate, formatDateTime, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/utils'
import { ReorderButton } from '@/components/shop/reorder-button'
import { ChevronLeft } from 'lucide-react'

export default async function CustomerOrderPage({
  params,
}: {
  params: Promise<{ tenant: string; id: string }>
}) {
  const { tenant: tenantSlug, id } = await params
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

  const { data: order } = await supabase
    .from('orders')
    .select('*, payment_methods(label)')
    .eq('id', id)
    .eq('customer_id', customer.id)
    .single()

  if (!order) notFound()

  const { data: items } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', id)
    .order('created_at')

  const pm = order.payment_methods as unknown as { label: string } | null
  const addr = order.delivery_address as { street?: string; city?: string; postal_code?: string } | null

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/sklep/${tenantSlug}/zamowienia`} className="text-gray-400 hover:text-gray-600">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <div className="text-sm text-gray-500">Zamówienie</div>
          <h1 className="text-xl font-bold font-mono text-gray-900">{order.order_number}</h1>
        </div>
        <span className={`ml-auto text-sm px-3 py-1.5 rounded-full font-medium ${ORDER_STATUS_COLORS[order.status]}`}>
          {ORDER_STATUS_LABELS[order.status]}
        </span>
      </div>

      {/* Info */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4 text-sm">
          <div className="text-xs text-gray-500 uppercase font-medium mb-1">Data złożenia</div>
          <div className="text-gray-900">{formatDateTime(order.created_at)}</div>
          {order.delivery_date && <>
            <div className="text-xs text-gray-500 uppercase font-medium mb-1 mt-3">Termin dostawy</div>
            <div className="text-gray-900">{formatDate(order.delivery_date)}</div>
          </>}
        </div>
        <div className="bg-white rounded-xl border p-4 text-sm">
          {pm && <>
            <div className="text-xs text-gray-500 uppercase font-medium mb-1">Forma płatności</div>
            <div className="text-gray-900">{pm.label}</div>
          </>}
          {addr && <>
            <div className="text-xs text-gray-500 uppercase font-medium mb-1 mt-3">Adres dostawy</div>
            <div className="text-gray-900">{addr.street}<br />{addr.postal_code} {addr.city}</div>
          </>}
        </div>
      </div>

      {order.customer_notes && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-sm text-amber-900">
          <div className="font-medium text-xs uppercase text-amber-600 mb-1">Twoje uwagi</div>
          {order.customer_notes}
        </div>
      )}

      {/* Pozycje */}
      <div className="bg-white rounded-xl border overflow-hidden mb-4">
        <div className="p-4 border-b font-semibold text-gray-900">Zamówione produkty</div>
        <div className="divide-y">
          {items?.map(item => (
            <div key={item.id} className="p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-900">{item.product_name}</div>
                {item.customer_notes && <div className="text-xs text-amber-600 mt-0.5">{item.customer_notes}</div>}
                <div className="text-xs text-gray-400 mt-0.5">
                  Zamówiono: {item.ordered_qty} {item.product_unit}
                  {item.fulfilled_qty !== null && item.fulfilled_qty !== item.ordered_qty && (
                    <span className="text-orange-500 ml-2">· Zrealizowano: {item.fulfilled_qty} {item.product_unit}</span>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-semibold text-sm text-gray-900">{formatCurrency(item.line_total_net)}</div>
                <div className="text-xs text-gray-400">{formatCurrency(item.unit_price_net)} / {item.product_unit}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t bg-gray-50 space-y-1 text-sm">
          <div className="flex justify-between text-gray-500"><span>Netto:</span><span>{formatCurrency(order.subtotal_net)}</span></div>
          <div className="flex justify-between text-gray-500"><span>VAT:</span><span>{formatCurrency(order.total_vat)}</span></div>
          <div className="flex justify-between font-bold text-gray-900 text-base"><span>Brutto:</span><span>{formatCurrency(order.total_gross)}</span></div>
        </div>
      </div>

      <ReorderButton
        tenantSlug={tenantSlug}
        brandColor={brandColor}
        items={items ?? []}
      />
    </div>
  )
}
