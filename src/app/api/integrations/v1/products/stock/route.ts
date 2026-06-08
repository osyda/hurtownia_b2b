import { NextResponse } from 'next/server'
import { z } from 'zod'
import { authenticateIntegration } from '@/lib/integrations/auth'

export const runtime = 'nodejs'

const stockItemSchema = z.object({
  sku: z.string().trim().min(1, 'SKU jest wymagane'),
  stock_quantity: z.coerce.number().min(0).nullable().optional(),
  stock_status: z.enum(['available', 'unavailable', 'limited']).optional(),
  external_product_id: z.string().trim().optional(),
}).refine(
  item => item.stock_quantity !== undefined || item.stock_status !== undefined,
  'Podaj stock_quantity lub stock_status'
)

const stockSchema = z.object({
  items: z.array(stockItemSchema).min(1).max(500),
})

export async function POST(request: Request) {
  const auth = await authenticateIntegration(request)
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json().catch(() => null)
  const parsed = stockSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const updated: string[] = []
  const missing: string[] = []

  for (const item of parsed.data.items) {
    const payload: { stock_quantity?: number | null; stock_status?: 'available' | 'unavailable' | 'limited' } = {}
    if (item.stock_quantity !== undefined) payload.stock_quantity = item.stock_quantity
    if (item.stock_status) payload.stock_status = item.stock_status

    const { data, error } = await auth.supabase
      .from('products')
      .update(payload)
      .eq('tenant_id', auth.integration.tenant_id)
      .eq('sku', item.sku)
      .select('id, sku')
      .maybeSingle()

    if (error) {
      await auth.supabase.from('integration_sync_logs').insert({
        tenant_id: auth.integration.tenant_id,
        integration_id: auth.integration.id,
        direction: 'inbound',
        entity_type: 'product',
        operation: 'stock_update',
        status: 'error',
        message: error.message,
        payload: { sku: item.sku },
      })

      return NextResponse.json({ error: error.message, updated, missing_skus: missing }, { status: 500 })
    }

    if (data?.sku) updated.push(data.sku)
    else missing.push(item.sku)
  }

  const status = missing.length === parsed.data.items.length ? 'skipped' : 'success'
  const message = `Zaktualizowano ${updated.length} produktów, brak SKU: ${missing.length}`

  await auth.supabase
    .from('tenant_integrations')
    .update({ last_error: status === 'success' ? null : message })
    .eq('id', auth.integration.id)

  await auth.supabase.from('integration_sync_logs').insert({
    tenant_id: auth.integration.tenant_id,
    integration_id: auth.integration.id,
    direction: 'inbound',
    entity_type: 'product',
    operation: 'stock_update',
    status,
    message,
    payload: {
      received: parsed.data.items.length,
      updated: updated.length,
      missing_skus: missing,
    },
  })

  return NextResponse.json({
    success: true,
    updated: updated.length,
    missing: missing.length,
    updated_skus: updated,
    missing_skus: missing,
  })
}
