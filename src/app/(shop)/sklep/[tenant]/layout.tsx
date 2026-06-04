import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ShopHeader } from '@/components/shop/shop-header'

export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ tenant: string }>
}) {
  const { tenant: tenantSlug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.role !== 'customer') redirect('/login')

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name, slug, logo_url, brand_color, customer_message')
    .eq('slug', tenantSlug)
    .eq('status', 'active')
    .maybeSingle()

  if (!tenant) notFound()

  const { data: customer } = await supabase
    .from('customers')
    .select('id, company_name, status')
    .eq('user_id', user.id)
    .eq('tenant_id', tenant.id)
    .maybeSingle()

  if (!customer || customer.status === 'inactive') redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50">
      <ShopHeader
        tenantSlug={tenantSlug}
        tenantName={tenant.name}
        brandColor={tenant.brand_color}
        logoUrl={tenant.logo_url}
        customerName={customer.company_name}
      />
      <main className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
