import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { IntegrationSettings } from '@/components/tenant/integration-settings'
import type { TenantIntegration } from '@/types/database.types'

export default async function IntegrationsPage({ params }: { params: Promise<{ tenant: string }> }) {
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

  const { data: integrations } = await supabase
    .from('tenant_integrations')
    .select('id, name, provider, sync_mode, is_active, connection_status, config, last_order_export_at, last_invoice_import_at')
    .eq('tenant_id', profile.tenant_id)
    .order('created_at', { ascending: true })

  return (
    <div className="p-4 md:p-8">
      <IntegrationSettings tenantSlug={tenantSlug} integrations={(integrations ?? []) as TenantIntegration[]} />
    </div>
  )
}
