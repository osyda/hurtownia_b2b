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
    .select('role, tenant_id, tenants(slug, name, logo_url, brand_color)')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (profile.role !== 'tenant_admin' && profile.role !== 'tenant_employee') redirect('/')

  const tenant = (profile.tenants as unknown as { slug: string; name: string; logo_url: string | null; brand_color: string } | null)
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
