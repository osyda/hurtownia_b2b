import { NextResponse } from 'next/server'
import { z } from 'zod'
import { authenticateIntegration } from '@/lib/integrations/auth'

export const runtime = 'nodejs'

const orderStatusSchema = z.object({
  status: z.enum(['new', 'accepted', 'in_progress', 'ready', 'delivered', 'cancelled']).optional(),
  external_order_id: z.string().trim().optional(),
  external_order_number: z.string().trim().optional(),
  external_order_status: z.string().trim().min(1).optional(),
  raw_payload: z.record(z.unknown()).optional(),
}).refine(
  data => data.status || data.external_order_id || data.external_order_number || data.external_order_status,
  'Podaj status lub zewnętrzne dane zamówienia'
)

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const auth = await authenticateIntegration(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { orderId } = await params
  const body = await request.json().catch(() => null)
  const parsed = orderStatusSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const orderQuery = auth.supabase
    .from('orders')
    .select('id, tenant_id, order_number, external_payload')
    .eq('tenant_id', auth.integration.tenant_id)

  const { data: order, error: orderError } = uuidPattern.test(orderId)
    ? await orderQuery.eq('id', orderId).maybeSingle()
    : await orderQuery.eq('order_number', orderId).maybeSingle()

  if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 })
  if (!order) return NextResponse.json({ error: 'Nie znaleziono zamówienia' }, { status: 404 })

  const existingPayload = asRecord(order.external_payload)
  const updatePayload = {
    ...(parsed.data.status ? { status: parsed.data.status } : {}),
    ...(parsed.data.external_order_id ? { external_order_id: parsed.data.external_order_id } : {}),
    ...(parsed.data.external_order_number ? { external_order_number: parsed.data.external_order_number } : {}),
    ...(parsed.data.external_order_status ? { external_order_status: parsed.data.external_order_status } : {}),
    integration_id: auth.integration.id,
    external_payload: {
      ...existingPayload,
      last_status_update: parsed.data.raw_payload ?? body ?? {},
      last_status_update_at: new Date().toISOString(),
    },
  }

  const { error } = await auth.supabase
    .from('orders')
    .update(updatePayload)
    .eq('id', order.id)

  if (error) {
    await auth.supabase.from('integration_sync_logs').insert({
      tenant_id: auth.integration.tenant_id,
      integration_id: auth.integration.id,
      direction: 'inbound',
      entity_type: 'order',
      entity_id: order.id,
      operation: 'status_update',
      status: 'error',
      message: error.message,
      payload: body ?? {},
    })

    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await auth.supabase.from('integration_sync_logs').insert({
    tenant_id: auth.integration.tenant_id,
    integration_id: auth.integration.id,
    direction: 'inbound',
    entity_type: 'order',
    entity_id: order.id,
    operation: 'status_update',
    status: 'success',
    message: `Zaktualizowano status zamówienia ${order.order_number}`,
    payload: body ?? {},
  })

  return NextResponse.json({
    success: true,
    order_id: order.id,
    order_number: order.order_number,
    status: parsed.data.status ?? null,
    external_order_status: parsed.data.external_order_status ?? null,
  })
}
