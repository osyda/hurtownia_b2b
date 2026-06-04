import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsForm } from '@/components/tenant/settings-form'

export default async function SettingsPage({
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
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()
  if (!profile?.tenant_id) redirect('/login')

  const [tenantRes, deliveryRes, paymentMethodsRes] = await Promise.all([
    supabase.from('tenants')
      .select('id, name, slug, brand_color, contact_email, contact_phone')
      .eq('id', profile.tenant_id)
      .single(),
    supabase.from('delivery_settings')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .single(),
    supabase.from('payment_methods')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .order('created_at'),
  ])

  return (
    <SettingsForm
      tenantSlug={tenantSlug}
      tenant={tenantRes.data}
      delivery={deliveryRes.data}
      paymentMethods={paymentMethodsRes.data ?? []}
      isAdmin={profile.role === 'tenant_admin'}
    />
  )
}
