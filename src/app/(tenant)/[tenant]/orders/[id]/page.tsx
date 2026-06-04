import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { OrderDetail } from '@/components/tenant/order-detail'
import { formatCurrency, formatDateTime, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, PAYMENT_METHOD_LABELS } from '@/lib/utils'

export default async function OrderDetailPage({ params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant: tenantSlug, id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('user_profiles').select('tenant_id').eq('id', user.id).single()
  if (!profile?.tenant_id) redirect('/login')

  const { data: order } = await supabase.from('orders')
    .select('*, customers(company_name, email, phone, nip), payment_methods(label, type)')
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .single()

  if (!order) notFound()

  const { data: items } = await supabase.from('order_items')
    .select('*')
    .eq('order_id', id)
    .order('created_at')

  const customer = order.customers as unknown as { company_name: string; email: string; phone: string; nip: string } | null
  const paymentMethod = order.payment_methods as unknown as { label: string; type: string } | null
  const deliveryAddress = order.delivery_address as { street?: string; city?: string; postal_code?: string } | null

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-sm text-gray-500 mb-1">Zamówienie</div>
          <h1 className="text-2xl font-bold text-gray-900 font-mono">{order.order_number}</h1>
          <div className="text-sm text-gray-400 mt-1">{formatDateTime(order.created_at)}</div>
        </div>
        <span className={`text-sm px-3 py-1.5 rounded-full font-medium ${ORDER_STATUS_COLORS[order.status]}`}>
          {ORDER_STATUS_LABELS[order.status]}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <div className="text-xs font-medium text-gray-500 uppercase mb-2">Klient</div>
          <div className="font-medium text-gray-900">{customer?.company_name}</div>
          <div className="text-sm text-gray-500">{customer?.email}</div>
          <div className="text-sm text-gray-500">{customer?.phone}</div>
          {customer?.nip && <div className="text-sm text-gray-400">NIP: {customer.nip}</div>}
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-xs font-medium text-gray-500 uppercase mb-2">Dostawa</div>
          <div className="font-medium text-gray-900">{order.delivery_date || 'Nie ustalono'}</div>
          {deliveryAddress && (
            <div className="text-sm text-gray-500 mt-1">
              <div>{deliveryAddress.street}</div>
              <div>{deliveryAddress.postal_code} {deliveryAddress.city}</div>
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-xs font-medium text-gray-500 uppercase mb-2">Płatność</div>
          <div className="font-medium text-gray-900">{paymentMethod?.label || '—'}</div>
          <div className="mt-2 pt-2 border-t">
            <div className="flex justify-between text-sm text-gray-500"><span>Netto:</span><span>{formatCurrency(order.subtotal_net)}</span></div>
            <div className="flex justify-between text-sm text-gray-500"><span>VAT:</span><span>{formatCurrency(order.total_vat)}</span></div>
            <div className="flex justify-between font-bold text-gray-900 mt-1"><span>Brutto:</span><span>{formatCurrency(order.total_gross)}</span></div>
          </div>
        </div>
      </div>

      {order.customer_notes && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="text-xs font-medium text-amber-700 uppercase mb-1">Uwagi klienta</div>
          <p className="text-sm text-amber-900">{order.customer_notes}</p>
        </div>
      )}

      <OrderDetail
        tenantSlug={tenantSlug}
        order={order}
        items={items ?? []}
      />
    </div>
  )
}
