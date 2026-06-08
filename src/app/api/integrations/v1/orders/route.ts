import { NextResponse } from 'next/server'
import { authenticateIntegration } from '@/lib/integrations/auth'

export const runtime = 'nodejs'

const allowedStatuses = new Set(['new', 'accepted', 'in_progress', 'ready', 'delivered', 'cancelled'])

export async function GET(request: Request) {
  const auth = await authenticateIntegration(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const url = new URL(request.url)
  const status = url.searchParams.get('status')
  const since = url.searchParams.get('since')
  const limit = Math.min(Number(url.searchParams.get('limit') || 50), 100)

  let query = auth.supabase
    .from('orders')
    .select(`
      id,
      order_number,
      status,
      delivery_date,
      delivery_address,
      customer_notes,
      subtotal_net,
      total_vat,
      total_gross,
      created_at,
      updated_at,
      external_order_id,
      external_order_number,
      external_order_status,
      customers(id, company_name, nip, email, phone, invoice_address),
      payment_methods(id, label, type),
      order_items(
        id,
        product_id,
        product_name,
        product_sku,
        product_unit,
        ordered_qty,
        fulfilled_qty,
        unit_price_net,
        vat_rate,
        line_total_net,
        customer_notes
      )
    `)
    .eq('tenant_id', auth.integration.tenant_id)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (status && allowedStatuses.has(status)) query = query.eq('status', status)
  if (since) query = query.gte('updated_at', since)

  const { data: orders, error } = await query

  if (error) {
    await auth.supabase.from('integration_sync_logs').insert({
      tenant_id: auth.integration.tenant_id,
      integration_id: auth.integration.id,
      direction: 'outbound',
      entity_type: 'order',
      operation: 'list_orders',
      status: 'error',
      message: error.message,
    })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await auth.supabase
    .from('tenant_integrations')
    .update({ last_order_export_at: new Date().toISOString(), last_error: null })
    .eq('id', auth.integration.id)

  await auth.supabase.from('integration_sync_logs').insert({
    tenant_id: auth.integration.tenant_id,
    integration_id: auth.integration.id,
    direction: 'outbound',
    entity_type: 'order',
    operation: 'list_orders',
    status: 'success',
    message: `Returned ${orders?.length ?? 0} orders`,
    payload: { status, since, limit },
  })

  return NextResponse.json({
    provider: auth.integration.provider,
    integration_id: auth.integration.id,
    count: orders?.length ?? 0,
    orders: orders ?? [],
  })
}
