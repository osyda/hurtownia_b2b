import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, tenant_id, tenants(slug)')
    .eq('id', user.id)
    .single()

  if (!profile) {
    await supabase.auth.signOut()
    redirect('/login')
  }

  if (profile.role === 'super_admin') {
    redirect('/admin/dashboard')
  }

  if (profile.role === 'tenant_admin' || profile.role === 'tenant_employee') {
    const tenant = (profile.tenants as unknown as { slug: string } | null)
    if (tenant?.slug) redirect(`/${tenant.slug}/dashboard`)
    // Brak tenanta — wyloguj
    await supabase.auth.signOut()
    redirect('/login')
  }

  if (profile.role === 'customer') {
    const { data: customer } = await supabase
      .from('customers')
      .select('tenant_id, tenants(slug)')
      .eq('user_id', user.id)
      .single()
    const tenant = (customer?.tenants as unknown as { slug: string } | null)
    if (tenant?.slug) redirect(`/sklep/${tenant.slug}`)
    await supabase.auth.signOut()
    redirect('/login')
  }

  await supabase.auth.signOut()
  redirect('/login')
}
