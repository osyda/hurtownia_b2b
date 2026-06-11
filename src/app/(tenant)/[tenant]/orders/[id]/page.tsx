import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { OrderDetail } from '@/components/tenant/order-detail'
import { InvoiceList } from '@/components/shared/invoice-list'
import { formatCurrency, formatDateTime, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/utils'
import type { OrderInvoice } from '@/types/database.types'

export default async function OrderDetailPage({ params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant: tenantSlug, id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) redirect('/login')

  const { data: order } = await supabase.from('orders')
    .select('*, customers(company_name, email, phone, nip), payment_methods(label, type)')
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .single()

  if (!order) notFound()

  const [{ data: items }, { data: invoices }] = await Promise.all([
    supabase.from('order_items').select('*').eq('order_id', id).order('created_at'),
    supabase.from('order_invoices').select('*').eq('order_id', id).order('invoice_date', { ascending: false }),
  ])

  const customer = order.customers as unknown as { company_name: string; email: string; phone: string; nip: string } | null
  const paymentMethod = order.payment_methods as unknown as { label: string; type: string } | null
  const deliveryAddress = order.delivery_address as { street?: string; city?: string; postal_code?: string } | null

  return (
    <div className="max-w-5xl p-4 md:p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <div className="mb-1 text-sm text-gray-500">Zamówienie</div>
          <h1 className="font-mono text-2xl font-black text-gray-900">{order.order_number}</h1>
          <div className="mt-1 text-sm text-gray-400">{formatDateTime(order.created_at)}</div>
        </div>
        <span className={`rounded-full px-3 py-1.5 text-sm font-bold ${ORDER_STATUS_COLORS[order.status]}`}>
          {ORDER_STATUS_LABELS[order.status]}
        </span>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="premium-card p-4">
          <div className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Klient</div>
          <div className="font-bold text-gray-900">{customer?.company_name}</div>
          <div className="text-sm text-gray-500">{customer?.email}</div>
          <div className="text-sm text-gray-500">{customer?.phone}</div>
          {customer?.nip && <div className="text-sm text-gray-400">NIP: {customer.nip}</div>}
        </div>
        <div className="premium-card p-4">
          <div className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Dostawa</div>
          <div className="font-bold text-gray-900">
            {order.delivery_date || 'Nie ustalono'}
            {order.delivery_window ? `, ${order.delivery_window}` : ''}
          </div>
          {deliveryAddress && (
            <div className="mt-1 text-sm text-gray-500">
              <div>{deliveryAddress.street}</div>
              <div>{deliveryAddress.postal_code} {deliveryAddress.city}</div>
            </div>
          )}
        </div>
        <div className="premium-card p-4">
          <div className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Płatność</div>
          <div className="font-bold text-gray-900">{paymentMethod?.label || '—'}</div>
          <div className="mt-2 border-t pt-2">
            <div className="flex justify-between text-sm text-gray-500"><span>Netto:</span><span>{formatCurrency(order.subtotal_net)}</span></div>
            <div className="flex justify-between text-sm text-gray-500"><span>VAT:</span><span>{formatCurrency(order.total_vat)}</span></div>
            <div className="mt-1 flex justify-between font-black text-gray-900"><span>Brutto:</span><span>{formatCurrency(order.total_gross)}</span></div>
          </div>
        </div>
      </div>

      {order.customer_notes && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-amber-700">Uwagi klienta</div>
          <p className="text-sm text-amber-900">{order.customer_notes}</p>
        </div>
      )}

      <OrderDetail tenantSlug={tenantSlug} order={order} items={items ?? []} />

      <div className="mt-6">
        <InvoiceList invoices={(invoices ?? []) as OrderInvoice[]} />
      </div>
    </div>
  )
}
