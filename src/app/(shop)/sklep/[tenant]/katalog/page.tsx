import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { ProductCatalog } from '@/components/shop/product-catalog'
import { getShopBasePath } from '@/lib/shop-routing'

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>
  searchParams: Promise<{ q?: string; category?: string }>
}) {
  const { tenant: tenantSlug } = await params
  const { q, category } = await searchParams
  const shopBasePath = getShopBasePath(tenantSlug, (await headers()).get('host'))
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get customer with price group
  const { data: customer } = await supabase
    .from('customers')
    .select('id, price_group_id, min_order_value, tenants!inner(id, brand_color, delivery_settings(delivery_days, order_cutoff_time, min_order_value))')
    .eq('user_id', user.id)
    .single()

  if (!customer) redirect('/login')
  const tenantInfo = customer.tenants as unknown as {
    id: string
    brand_color: string
    delivery_settings: Array<{
      delivery_days: number[]
      order_cutoff_time: string
      min_order_value: number | null
    }>
  }
  const deliverySettings = tenantInfo.delivery_settings?.[0] ?? null

  // Get categories
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('tenant_id', tenantInfo.id)
    .eq('is_active', true)
    .order('sort_order')

  // Get products with visibility filtering
  let productQuery = supabase
    .from('products')
    .select('id, name, sku, image_url, unit, base_price, vat_rate, min_order_qty, order_multiple, stock_status, category_id, categories(name)')
    .eq('tenant_id', tenantInfo.id)
    .eq('status', 'active')
    .order('name')

  if (category) productQuery = productQuery.eq('category_id', category)

  const { data: products } = await productQuery

  // Get price overrides for this customer
  const productIds = products?.map(p => p.id) ?? []
  let priceMap: Record<string, number> = {}

  if (productIds.length > 0) {
    // Individual prices first
    const { data: individualPrices } = await supabase
      .from('product_prices')
      .select('product_id, price')
      .eq('customer_id', customer.id)
      .in('product_id', productIds)

    individualPrices?.forEach(p => { priceMap[p.product_id] = p.price })

    // Group prices (only where individual doesn't exist)
    if (customer.price_group_id) {
      const { data: groupPrices } = await supabase
        .from('product_prices')
        .select('product_id, price')
        .eq('price_group_id', customer.price_group_id)
        .in('product_id', productIds)

      groupPrices?.forEach(p => {
        if (priceMap[p.product_id] === undefined) priceMap[p.product_id] = p.price
      })
    }
  }

  // Merge prices into products
  const productsWithPrices = products?.map(p => ({
    ...p,
    customer_price: priceMap[p.id] ?? p.base_price,
    category_name: (p.categories as unknown as { name: string } | null)?.name ?? null,
  })) ?? []

  return (
    <ProductCatalog
      brandColor={(customer.tenants as unknown as { brand_color: string }).brand_color}
      categories={categories ?? []}
      products={productsWithPrices}
      searchQuery={q}
      activeCategory={category}
      shopBasePath={shopBasePath}
      deliveryDays={deliverySettings?.delivery_days ?? [1, 2, 3, 4, 5]}
      cutoffTime={deliverySettings?.order_cutoff_time ?? '20:00:00'}
      minOrderValue={Math.max(customer.min_order_value ?? 0, deliverySettings?.min_order_value ?? 0)}
    />
  )
}
