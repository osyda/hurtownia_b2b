import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PricesPanel } from '@/components/tenant/prices-panel'

export default async function PricesPage({
  params,
}: {
  params: Promise<{ tenant: string }>
}) {
  const { tenant: tenantSlug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()
  if (!profile?.tenant_id) redirect('/login')

  const tenantId = profile.tenant_id

  const [groupsRes, customersRes, productsRes] = await Promise.all([
    supabase.from('price_groups')
      .select('id, name, description, discount_percent')
      .eq('tenant_id', tenantId)
      .order('name'),
    supabase.from('customers')
      .select('id, company_name, price_group_id')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .order('company_name'),
    supabase.from('products')
      .select('id, name, sku, base_price, unit')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .order('name'),
  ])

  return (
    <PricesPanel
      tenantSlug={tenantSlug}
      groups={groupsRes.data ?? []}
      customers={customersRes.data ?? []}
      products={productsRes.data ?? []}
    />
  )
}
