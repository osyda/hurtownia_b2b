import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TenantSidebar } from '@/components/tenant/tenant-sidebar'

export default async function TenantLayout({
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
    .select('role, tenant_id')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) redirect('/login')
  if (profile.role !== 'tenant_admin' && profile.role !== 'tenant_employee') redirect('/login')

  const { data: tenant } = await supabase
    .from('tenants')
    .select('slug, name, brand_color')
    .eq('id', profile.tenant_id)
    .maybeSingle()

  if (!tenant || tenant.slug !== tenantSlug) notFound()

  return (
    <div className="flex h-screen bg-gray-50">
      <TenantSidebar
        tenantSlug={tenantSlug}
        tenantName={tenant.name}
        brandColor={tenant.brand_color}
        role={profile.role}
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
