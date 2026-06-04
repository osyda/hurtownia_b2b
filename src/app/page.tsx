import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, tenant_id')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) redirect('/login')

  if (profile.role === 'super_admin') {
    redirect('/dashboard')
  }

  if (profile.role === 'tenant_admin' || profile.role === 'tenant_employee') {
    if (!profile.tenant_id) redirect('/login')
    const { data: tenant } = await supabase
      .from('tenants')
      .select('slug')
      .eq('id', profile.tenant_id)
      .maybeSingle()
    if (tenant?.slug) redirect(`/${tenant.slug}/dashboard`)
    redirect('/login')
  }

  if (profile.role === 'customer') {
    const { data: customer } = await supabase
      .from('customers')
      .select('tenant_id, tenants(slug)')
      .eq('user_id', user.id)
      .maybeSingle()
    const tenantSlug = (customer?.tenants as unknown as { slug: string } | null)?.slug
    if (tenantSlug) redirect(`/sklep/${tenantSlug}`)
    redirect('/login')
  }

  redirect('/login')
}
