'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { CartItem } from '@/lib/cart-store'
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
  const adminSupabase = await createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nie zalogowano' }

  const {
    tenantSlug,
    items,
    deliveryDate,
    deliveryAddressId,
    deliveryAddress,
    paymentMethodId,
    customerNotes,
  } = input

  if (!items.length) return { error: 'Koszyk jest pusty' }

  const { data: customer } = await supabase
    .from('customers')
    .select('id, company_name, price_group_id, tenants!inner(id, slug, name, contact_email)')
    .eq('user_id', user.id)
    .single()

  if (!customer) redirect('/login')

  const tenant = customer.tenants as unknown as {
    id: string
    slug: string
    name: string
    contact_email: string | null
  }

  if (tenant.slug !== tenantSlug) {
    return { error: 'Niepoprawny adres sklepu dla tego konta' }
  }

  if (deliveryAddressId) {
    const { data: address } = await supabase
      .from('customer_addresses')
      .select('id')
      .eq('id', deliveryAddressId)
      .eq('customer_id', customer.id)
      .maybeSingle()

    if (!address) return { error: 'Wybrany adres dostawy jest niedostępny' }
  }

  if (!paymentMethodId) {
    return { error: 'Wybierz formę płatności' }
  }

  const { data: paymentAssignment } = await supabase
    .from('customer_payment_methods')
    .select('payment_methods!inner(id, tenant_id, is_active)')
    .eq('customer_id', customer.id)
    .eq('payment_method_id', paymentMethodId)
    .maybeSingle()

  const assignedPaymentMethod = paymentAssignment?.payment_methods as unknown as {
    id: string
    tenant_id: string
    is_active: boolean
  } | null

  if (!assignedPaymentMethod || assignedPaymentMethod.tenant_id !== tenant.id || !assignedPaymentMethod.is_active) {
    return { error: 'Wybrana metoda płatności jest niedostępna dla tego klienta' }
  }

  const productIds = Array.from(new Set(items.map(item => item.productId)))
  if (productIds.length === 0 || productIds.some(id => !id)) {
    return { error: 'Koszyk zawiera niepoprawne produkty' }
  }

  const cartItemsByProduct = new Map(items.map(item => [item.productId, item]))

  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, sku, unit, base_price, vat_rate, min_order_qty, order_multiple, stock_quantity, stock_status')
    .eq('tenant_id', tenant.id)
    .eq('status', 'active')
    .in('id', productIds)

  if (productsError) return { error: productsError.message }
  if (!products || products.length !== productIds.length) {
    return { error: 'Niektóre produkty są niedostępne albo zostały ukryte' }
  }

  const priceMap: Record<string, number> = {}

  const { data: individualPrices } = await supabase
    .from('product_prices')
    .select('product_id, price')
    .eq('customer_id', customer.id)
    .in('product_id', productIds)

  individualPrices?.forEach(price => {
    priceMap[price.product_id] = Number(price.price)
  })

  if (customer.price_group_id) {
    const { data: groupPrices } = await supabase
      .from('product_prices')
      .select('product_id, price')
      .eq('price_group_id', customer.price_group_id)
      .in('product_id', productIds)

    groupPrices?.forEach(price => {
      if (priceMap[price.product_id] === undefined) {
        priceMap[price.product_id] = Number(price.price)
      }
    })
  }

  let subtotalNet = 0
  let totalVat = 0
  let orderItems: {
    product_id: string
    product_name: string
    product_sku: string | null
    product_unit: string
    ordered_qty: number
    unit_price_net: number
    vat_rate: number
    line_total_net: number
    customer_notes: string | null
  }[] = []

  try {
    orderItems = products.map(product => {
      const item = cartItemsByProduct.get(product.id)
      if (!item) throw new Error('Produkt nie istnieje w koszyku')

      const qty = Number(item.qty)
      const minQty = Number(product.min_order_qty)
      const multiple = Number(product.order_multiple) || 1
      const stockQuantity = product.stock_quantity === null ? null : Number(product.stock_quantity)

      if (!Number.isFinite(qty) || qty <= 0 || qty < minQty) {
        throw new Error(`Niepoprawna ilość dla produktu: ${product.name}`)
      }

      const multipleUnits = (qty - minQty) / multiple
      if (Math.abs(multipleUnits - Math.round(multipleUnits)) > 0.000001) {
        throw new Error(`Ilość produktu ${product.name} musi być zgodna z wielokrotnością zamówienia`)
      }

      if (product.stock_status === 'unavailable') {
        throw new Error(`Produkt ${product.name} jest niedostępny`)
      }

      if (stockQuantity !== null && qty > stockQuantity) {
        throw new Error(`Brak wystarczajacego stanu dla produktu: ${product.name}`)
      }

      const unitPrice = priceMap[product.id] ?? Number(product.base_price)
      const vatRate = Number(product.vat_rate)
      const net = Number((unitPrice * qty).toFixed(2))
      subtotalNet += net
      totalVat += Number((net * vatRate / 100).toFixed(2))

      return {
        product_id: product.id,
        product_name: product.name,
        product_sku: product.sku,
        product_unit: product.unit,
        ordered_qty: qty,
        unit_price_net: unitPrice,
        vat_rate: vatRate,
        line_total_net: net,
        customer_notes: item.notes || null,
      }
    })
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Nie udało się przeliczyć koszyka' }
  }

  subtotalNet = Number(subtotalNet.toFixed(2))
  totalVat = Number(totalVat.toFixed(2))
  const totalGross = Number((subtotalNet + totalVat).toFixed(2))

  if (orderItems.length === 0) return { error: 'Koszyk jest pusty' }

  async function buildOrderNumber() {
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
    const { count } = await adminSupabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenant.id)
      .gte('created_at', today.toISOString().slice(0, 10))

    return `${dateStr}-${String((count ?? 0) + 1).padStart(4, '0')}`
  }

  let order: { id: string; order_number: string } | null = null
  let lastOrderError: string | null = null

  for (let attempt = 0; attempt < 3; attempt++) {
    const orderNumber = await buildOrderNumber()
    const { data, error } = await adminSupabase
      .from('orders')
      .insert({
        tenant_id: tenant.id,
        customer_id: customer.id,
        order_number: orderNumber,
        status: 'new',
        delivery_date: deliveryDate || null,
        delivery_address_id: deliveryAddressId || null,
        delivery_address: deliveryAddress,
        payment_method_id: paymentMethodId,
        customer_notes: customerNotes || null,
        subtotal_net: subtotalNet,
        total_vat: totalVat,
        total_gross: totalGross,
      })
      .select('id, order_number')
      .single()

    if (!error && data) {
      order = data
      break
    }

    lastOrderError = error?.message ?? null
    if (error?.code !== '23505') break
  }

  if (!order) {
    return { error: lastOrderError ?? 'Nie udało się zapisać zamówienia' }
  }

  const { error: itemsError } = await adminSupabase.from('order_items').insert(
    orderItems.map(item => ({ ...item, order_id: order.id }))
  )

  if (itemsError) {
    await adminSupabase.from('orders').delete().eq('id', order.id)
    return { error: itemsError.message }
  }

  if (tenant.contact_email) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.dostawio.pl'
    await sendNewOrderEmail({
      tenantEmail: tenant.contact_email,
      tenantName: tenant.name,
      orderNumber: order.order_number,
      customerName: customer.company_name ?? 'Klient',
      totalGross,
      orderUrl: `${appUrl}/${tenantSlug}/orders/${order.id}`,
    }).catch(error => {
      console.error('[email:new_order] Failed to send new order email', error)
    })
  }

  revalidatePath(`/sklep/${tenantSlug}`)
  revalidatePath(`/sklep/${tenantSlug}/zamowienia`)

  return { success: true, orderId: order.id, orderNumber: order.order_number }
}
