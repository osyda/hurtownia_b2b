import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Use admin client to bypass potential RLS issues on user_profiles
  const adminSupabase = await createAdminClient()
  const { data: profile } = await adminSupabase
    .from('user_profiles')
    .select('role, tenant_id')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    await supabase.auth.signOut()
    redirect('/login')
  }

  if (profile.role === 'super_admin') {
    redirect('/admin/dashboard')
  }

  if (profile.role === 'tenant_admin' || profile.role === 'tenant_employee') {
    if (!profile.tenant_id) {
      await supabase.auth.signOut()
      redirect('/login')
    }
    const { data: tenant } = await adminSupabase
      .from('tenants')
      .select('slug')
      .eq('id', profile.tenant_id)
      .maybeSingle()
    if (tenant?.slug) redirect(`/${tenant.slug}/dashboard`)
    await supabase.auth.signOut()
    redirect('/login')
  }

  if (profile.role === 'customer') {
    const { data: customer } = await adminSupabase
      .from('customers')
      .select('tenant_id, tenants(slug)')
      .eq('user_id', user.id)
      .maybeSingle()
    const tenantSlug = (customer?.tenants as unknown as { slug: string } | null)?.slug
    if (tenantSlug) redirect(`/sklep/${tenantSlug}`)
    await supabase.auth.signOut()
    redirect('/login')
  }

  await supabase.auth.signOut()
  redirect('/login')
}
