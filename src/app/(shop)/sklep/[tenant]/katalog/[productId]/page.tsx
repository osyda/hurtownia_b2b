import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProductDetails } from '@/components/shop/product-details'
import { getShopBasePath } from '@/lib/shop-routing'

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ tenant: string; productId: string }>
}) {
  const { tenant: tenantSlug, productId } = await params
  const shopBasePath = getShopBasePath(tenantSlug, (await headers()).get('host'))
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: customer } = await supabase
    .from('customers')
    .select('id, price_group_id, tenants!inner(id, brand_color)')
    .eq('user_id', user.id)
    .single()

  if (!customer) redirect('/login')

  const tenantInfo = customer.tenants as unknown as { id: string; brand_color: string }
  const { data: product } = await supabase
    .from('products')
    .select('id, name, sku, description, image_url, unit, base_price, vat_rate, min_order_qty, order_multiple, stock_status, categories(name)')
    .eq('tenant_id', tenantInfo.id)
    .eq('status', 'active')
    .eq('id', productId)
    .maybeSingle()

  if (!product) notFound()

  const { data: individualPrice } = await supabase
    .from('product_prices')
    .select('price')
    .eq('customer_id', customer.id)
    .eq('product_id', product.id)
    .maybeSingle()

  let groupPrice: { price: number } | null = null

  if (!individualPrice && customer.price_group_id) {
    const { data } = await supabase
      .from('product_prices')
      .select('price')
      .eq('price_group_id', customer.price_group_id)
      .eq('product_id', product.id)
      .maybeSingle()

    groupPrice = data
  }

  return (
    <ProductDetails
      brandColor={tenantInfo.brand_color}
      backHref={`${shopBasePath}/katalog`}
      product={{
        ...product,
        customer_price: individualPrice?.price ?? groupPrice?.price ?? product.base_price,
        category_name: (product.categories as unknown as { name: string } | null)?.name ?? null,
      }}
    />
  )
}
