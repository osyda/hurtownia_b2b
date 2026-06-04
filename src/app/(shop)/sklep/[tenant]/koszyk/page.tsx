import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CartView } from '@/components/shop/cart-view'

export default async function CartPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: tenantSlug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: customer } = await supabase
    .from('customers')
    .select('id, min_order_value, tenants!inner(id, brand_color, delivery_settings(delivery_days, order_cutoff_time, min_order_value, customer_info))')
    .eq('user_id', user.id)
    .single()

  if (!customer) redirect('/login')

  const tenantInfo = customer.tenants as unknown as {
    id: string
    brand_color: string
    delivery_settings: Array<{
      delivery_days: number[]
      order_cutoff_time: string
      min_order_value: number
      customer_info: string | null
    }>
  }

  const deliverySettings = tenantInfo.delivery_settings?.[0] ?? null

  // Customer addresses
  const { data: addresses } = await supabase
    .from('customer_addresses')
    .select('*')
    .eq('customer_id', customer.id)
    .order('is_default', { ascending: false })

  // Payment methods for this customer
  const { data: paymentMethods } = await supabase
    .from('customer_payment_methods')
    .select('payment_methods(id, label, type)')
    .eq('customer_id', customer.id)

  const methods = paymentMethods?.map(pm => {
    const m = pm.payment_methods as unknown as { id: string; label: string; type: string } | null
    return m
  }).filter(Boolean) ?? []

  return (
    <CartView
      tenantSlug={tenantSlug}
      brandColor={tenantInfo.brand_color}
      customerId={customer.id}
      minOrderValue={Math.max(customer.min_order_value, deliverySettings?.min_order_value ?? 0)}
      addresses={addresses ?? []}
      paymentMethods={methods as { id: string; label: string; type: string }[]}
      deliveryInfo={deliverySettings?.customer_info ?? null}
      deliveryDays={deliverySettings?.delivery_days ?? [1, 2, 3, 4, 5]}
      cutoffTime={deliverySettings?.order_cutoff_time ?? '20:00:00'}
    />
  )
}
