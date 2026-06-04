'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CartItem } from '@/lib/cart-store'
import { sendNewOrderEmail } from '@/lib/email'

interface PlaceOrderInput {
  tenantSlug: string
  customerId: string
  items: CartItem[]
  deliveryDate: string
  deliveryAddressId: string | null
  deliveryAddress: { street: string; city: string; postal_code: string; country: string } | null
  paymentMethodId: string | null
  customerNotes: string
}

export async function placeOrder(input: PlaceOrderInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nie zalogowany' }

  const { tenantSlug, customerId, items, deliveryDate, deliveryAddressId, deliveryAddress, paymentMethodId, customerNotes } = input

  if (!items.length) return { error: 'Koszyk jest pusty' }

  // Get tenant id from slug
  const { data: tenant } = await supabase.from('tenants').select('id, name, contact_email').eq('slug', tenantSlug).single()
  if (!tenant) return { error: 'Hurtownia nie istnieje' }

  // Calculate totals
  let subtotalNet = 0
  let totalVat = 0
  for (const item of items) {
    const net = Number((item.price * item.qty).toFixed(2))
    subtotalNet += net
    totalVat += Number((net * item.vatRate / 100).toFixed(2))
  }
  subtotalNet = Number(subtotalNet.toFixed(2))
  totalVat = Number(totalVat.toFixed(2))
  const totalGross = Number((subtotalNet + totalVat).toFixed(2))

  // Generate order number
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
  const { count } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenant.id)
    .gte('created_at', today.toISOString().slice(0, 10))
  const orderNumber = `${dateStr}-${String((count ?? 0) + 1).padStart(4, '0')}`

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      tenant_id: tenant.id,
      customer_id: customerId,
      order_number: orderNumber,
      status: 'new',
      delivery_date: deliveryDate || null,
      delivery_address_id: deliveryAddressId || null,
      delivery_address: deliveryAddress,
      payment_method_id: paymentMethodId || null,
      customer_notes: customerNotes || null,
      subtotal_net: subtotalNet,
      total_vat: totalVat,
      total_gross: totalGross,
    })
    .select('id')
    .single()

  if (orderError || !order) return { error: orderError?.message ?? 'Błąd zapisu zamówienia' }

  // Create order items
  const orderItems = items.map(item => ({
    order_id: order.id,
    product_id: item.productId,
    product_name: item.name,
    product_sku: item.sku,
    product_unit: item.unit,
    ordered_qty: item.qty,
    unit_price_net: item.price,
    vat_rate: item.vatRate,
    line_total_net: Number((item.price * item.qty).toFixed(2)),
    customer_notes: item.notes || null,
  }))

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
  if (itemsError) return { error: itemsError.message }

  // Send email notification to tenant (fire-and-forget)
  if (tenant.contact_email && process.env.RESEND_API_KEY) {
    const { data: customer } = await supabase
      .from('customers')
      .select('company_name')
      .eq('id', customerId)
      .single()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hurtownia-b2b.vercel.app'
    sendNewOrderEmail({
      tenantEmail: tenant.contact_email,
      tenantName: tenant.name,
      orderNumber,
      customerName: customer?.company_name ?? 'Klient',
      totalGross,
      orderUrl: `${appUrl}/${tenantSlug}/orders/${order.id}`,
    }).catch(() => {})
  }

  return { success: true, orderId: order.id, orderNumber }
}
