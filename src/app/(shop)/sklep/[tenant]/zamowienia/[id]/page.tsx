import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDate, formatDateTime, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/utils'
import { ReorderButton } from '@/components/shop/reorder-button'
import { InvoiceList } from '@/components/shared/invoice-list'
import { ChevronLeft } from 'lucide-react'
import type { OrderInvoice } from '@/types/database.types'

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

  const [{ data: items }, { data: invoices }] = await Promise.all([
    supabase.from('order_items').select('*').eq('order_id', id).order('created_at'),
    supabase.from('order_invoices').select('*').eq('order_id', id).order('invoice_date', { ascending: false }),
  ])

  const pm = order.payment_methods as unknown as { label: string } | null
  const addr = order.delivery_address as { street?: string; city?: string; postal_code?: string } | null

  return (
    <div className="max-w-3xl space-y-5">
      <div className="mb-6 flex items-center gap-3">
        <Link href={`/sklep/${tenantSlug}/zamowienia`} className="text-gray-400 hover:text-gray-600">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <div className="text-sm text-gray-500">Zamówienie</div>
          <h1 className="font-mono text-xl font-black text-gray-900">{order.order_number}</h1>
        </div>
        <span className={`ml-auto rounded-full px-3 py-1.5 text-sm font-bold ${ORDER_STATUS_COLORS[order.status]}`}>
          {ORDER_STATUS_LABELS[order.status]}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="premium-card p-4 text-sm">
          <div className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Data złożenia</div>
          <div className="text-gray-900">{formatDateTime(order.created_at)}</div>
          {order.delivery_date && (
            <>
              <div className="mb-1 mt-3 text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Termin dostawy</div>
              <div className="text-gray-900">{formatDate(order.delivery_date)}</div>
            </>
          )}
        </div>
        <div className="premium-card p-4 text-sm">
          {pm && (
            <>
              <div className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Forma płatności</div>
              <div className="text-gray-900">{pm.label}</div>
            </>
          )}
          {addr && (
            <>
              <div className="mb-1 mt-3 text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Adres dostawy</div>
              <div className="text-gray-900">{addr.street}<br />{addr.postal_code} {addr.city}</div>
            </>
          )}
        </div>
      </div>

      {order.customer_notes && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <div className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-amber-600">Twoje uwagi</div>
          {order.customer_notes}
        </div>
      )}

      <div className="premium-card overflow-hidden">
        <div className="border-b p-4 font-black text-gray-900">Zamówione produkty</div>
        <div className="divide-y">
          {items?.map(item => (
            <div key={item.id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-gray-900">{item.product_name}</div>
                {item.customer_notes && <div className="mt-0.5 text-xs text-amber-600">{item.customer_notes}</div>}
                <div className="mt-0.5 text-xs text-gray-400">
                  Zamówiono: {item.ordered_qty} {item.product_unit}
                  {item.fulfilled_qty !== null && item.fulfilled_qty !== item.ordered_qty && (
                    <span className="ml-2 text-orange-500">- Zrealizowano: {item.fulfilled_qty} {item.product_unit}</span>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-sm font-bold text-gray-900">{formatCurrency(item.line_total_net)}</div>
                <div className="text-xs text-gray-400">{formatCurrency(item.unit_price_net)} / {item.product_unit}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-1 border-t bg-gray-50 p-4 text-sm">
          <div className="flex justify-between text-gray-500"><span>Netto:</span><span>{formatCurrency(order.subtotal_net)}</span></div>
          <div className="flex justify-between text-gray-500"><span>VAT:</span><span>{formatCurrency(order.total_vat)}</span></div>
          <div className="flex justify-between text-base font-black text-gray-900"><span>Brutto:</span><span>{formatCurrency(order.total_gross)}</span></div>
        </div>
      </div>

      <InvoiceList invoices={(invoices ?? []) as OrderInvoice[]} />

      <ReorderButton
        tenantSlug={tenantSlug}
        brandColor={brandColor}
        items={items ?? []}
      />
    </div>
  )
}
