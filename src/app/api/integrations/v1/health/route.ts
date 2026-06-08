import { NextResponse } from 'next/server'
import { authenticateIntegration } from '@/lib/integrations/auth'
import { getIntegrationProviderProfile } from '@/lib/integrations/provider-profiles'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const auth = await authenticateIntegration(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const profile = getIntegrationProviderProfile(auth.integration.provider)
  const checkedAt = new Date().toISOString()

  await auth.supabase.from('integration_sync_logs').insert({
    tenant_id: auth.integration.tenant_id,
    integration_id: auth.integration.id,
    direction: 'inbound',
    entity_type: 'integration',
    operation: 'health_check',
    status: 'success',
    message: 'Token API poprawny',
    payload: { checked_at: checkedAt },
  })

  return NextResponse.json({
    success: true,
    checked_at: checkedAt,
    integration: {
      id: auth.integration.id,
      name: auth.integration.name,
      provider: auth.integration.provider,
      provider_label: profile.label,
      tenant_id: auth.integration.tenant_id,
    },
    capabilities: profile.capabilities,
    endpoints: {
      orders: 'GET /api/integrations/v1/orders',
      invoice: 'POST /api/integrations/v1/orders/{orderId}/invoice',
      order_status: 'POST /api/integrations/v1/orders/{orderId}/status',
      stock: 'POST /api/integrations/v1/products/stock',
    },
  })
}
