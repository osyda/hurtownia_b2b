import { redirect } from 'next/navigation'
import { IntegrationSettings, type IntegrationSettingsRecord, type IntegrationSyncLogRecord } from '@/components/tenant/integration-settings'
import { createClient } from '@/lib/supabase/server'

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

  const [{ data: integrations }, { data: syncLogs }] = await Promise.all([
    supabase
      .from('tenant_integrations')
      .select('id, name, provider, sync_mode, is_active, connection_status, config, api_token_hash, last_order_export_at, last_invoice_import_at, last_error, created_at, updated_at')
      .eq('tenant_id', profile.tenant_id)
      .order('created_at', { ascending: true }),
    supabase
      .from('integration_sync_logs')
      .select('id, direction, entity_type, operation, status, message, created_at')
      .eq('tenant_id', profile.tenant_id)
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const safeIntegrations = (integrations ?? []).map(integration => {
    const { api_token_hash, ...rest } = integration
    return {
      ...rest,
      has_api_token: Boolean(api_token_hash),
    }
  })

  return (
    <div className="p-4 md:p-8">
      <IntegrationSettings
        tenantSlug={tenantSlug}
        integrations={safeIntegrations as IntegrationSettingsRecord[]}
        syncLogs={(syncLogs ?? []) as IntegrationSyncLogRecord[]}
      />
    </div>
  )
}
