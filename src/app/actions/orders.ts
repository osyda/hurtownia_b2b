'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { OrderStatus } from '@/types/database.types'
import { sendOrderStatusEmail } from '@/lib/email'
import { getTenantShopUrl } from '@/lib/shop-routing'
import { ORDER_STATUS_LABELS } from '@/lib/utils'

async function getTenantId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('user_profiles').select('tenant_id').eq('id', user.id).single()
  return data?.tenant_id ?? null
}

export async function updateOrderStatus(tenantSlug: string, orderId: string, status: OrderStatus) {
  const supabase = await createClient()
  const tenantId = await getTenantId(supabase)
  if (!tenantId) redirect('/login')

  const { data: order, error } = await supabase.from('orders')
    .update({ status })
    .eq('id', orderId)
    .eq('tenant_id', tenantId)
    .select('order_number, total_gross, internal_notes, customers(company_name, email)')
    .single()

  if (error) return { error: error.message }

  if (order) {
    const customer = order.customers as unknown as { company_name: string; email: string | null } | null
    if (customer?.email) {
      await sendOrderStatusEmail({
        customerEmail: customer.email,
        customerName: customer.company_name,
        orderNumber: order.order_number,
        status,
        statusLabel: ORDER_STATUS_LABELS[status] ?? status,
        totalGross: order.total_gross,
        orderUrl: getTenantShopUrl(tenantSlug, `zamowienia/${orderId}`),
        note: order.internal_notes ?? undefined,
      }).catch(error => {
        console.error('[email:order_status] Failed to send order status email', error)
      })
    }
  }

  revalidatePath(`/${tenantSlug}/orders/${orderId}`)
  revalidatePath(`/${tenantSlug}/orders`)
  return { success: true }
}

export async function updateOrderNote(tenantSlug: string, orderId: string, note: string) {
  const supabase = await createClient()
  const tenantId = await getTenantId(supabase)
  if (!tenantId) redirect('/login')

  const { error } = await supabase.from('orders')
    .update({ internal_notes: note })
    .eq('id', orderId)
    .eq('tenant_id', tenantId)

  if (error) return { error: error.message }
  revalidatePath(`/${tenantSlug}/orders/${orderId}`)
  return { success: true }
}

export async function updateOrderItemQty(
  tenantSlug: string,
  orderId: string,
  itemId: string,
  fulfilledQty: number
) {
  const supabase = await createClient()
  const tenantId = await getTenantId(supabase)
  if (!tenantId) redirect('/login')

  // Verify order belongs to this tenant
  const { data: order } = await supabase.from('orders')
    .select('id, subtotal_net, total_vat, total_gross')
    .eq('id', orderId)
    .eq('tenant_id', tenantId)
    .single()
  if (!order) return { error: 'Zamówienie nie istnieje' }

  // Get current item
  const { data: item } = await supabase.from('order_items')
    .select('unit_price_net, vat_rate')
    .eq('id', itemId)
    .eq('order_id', orderId)
    .single()
  if (!item) return { error: 'Pozycja nie istnieje' }

  const newLineNet = Number((fulfilledQty * item.unit_price_net).toFixed(2))

  const { error } = await supabase.from('order_items')
    .update({ fulfilled_qty: fulfilledQty, line_total_net: newLineNet })
    .eq('id', itemId)

  if (error) return { error: error.message }

  // Recalculate order totals from all items
  const { data: allItems } = await supabase.from('order_items')
    .select('fulfilled_qty, ordered_qty, unit_price_net, vat_rate')
    .eq('order_id', orderId)

  if (allItems) {
    let subtotalNet = 0
    let totalVat = 0
    for (const i of allItems) {
      const qty = i.fulfilled_qty ?? i.ordered_qty
      const net = qty * i.unit_price_net
      subtotalNet += net
      totalVat += net * (i.vat_rate / 100)
    }
    subtotalNet = Number(subtotalNet.toFixed(2))
    totalVat = Number(totalVat.toFixed(2))

    await supabase.from('orders').update({
      subtotal_net: subtotalNet,
      total_vat: totalVat,
      total_gross: Number((subtotalNet + totalVat).toFixed(2)),
    }).eq('id', orderId)
  }

  revalidatePath(`/${tenantSlug}/orders/${orderId}`)
  return { success: true }
}
