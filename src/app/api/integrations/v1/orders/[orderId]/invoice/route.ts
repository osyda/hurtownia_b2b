import { NextResponse } from 'next/server'
import { z } from 'zod'
import { authenticateIntegration } from '@/lib/integrations/auth'

export const runtime = 'nodejs'

const invoiceSchema = z.object({
  external_invoice_id: z.string().optional(),
  invoice_number: z.string().min(1),
  invoice_type: z.enum(['invoice', 'correction', 'proforma', 'receipt']).default('invoice'),
  invoice_date: z.string().optional(),
  sale_date: z.string().optional(),
  due_date: z.string().optional(),
  payment_method_label: z.string().optional(),
  payment_status: z.enum(['unknown', 'unpaid', 'partial', 'paid', 'overdue']).default('unknown'),
  currency: z.string().length(3).default('PLN'),
  total_net: z.number().optional(),
  total_vat: z.number().optional(),
  total_gross: z.number().optional(),
  pdf_url: z.string().url().optional(),
  pdf_storage_path: z.string().optional(),
  raw_payload: z.record(z.unknown()).optional(),
})

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

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
  const parsed = invoiceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const orderQuery = auth.supabase
    .from('orders')
    .select('id, tenant_id, order_number')
    .eq('tenant_id', auth.integration.tenant_id)

  const { data: order, error: orderError } = uuidPattern.test(orderId)
    ? await orderQuery.eq('id', orderId).maybeSingle()
    : await orderQuery.eq('order_number', orderId).maybeSingle()

  if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 })
  if (!order) return NextResponse.json({ error: 'Nie znaleziono zamówienia' }, { status: 404 })

  const payload = {
    tenant_id: auth.integration.tenant_id,
    order_id: order.id,
    integration_id: auth.integration.id,
    external_invoice_id: parsed.data.external_invoice_id || null,
    invoice_number: parsed.data.invoice_number,
    invoice_type: parsed.data.invoice_type,
    invoice_date: parsed.data.invoice_date || null,
    sale_date: parsed.data.sale_date || null,
    due_date: parsed.data.due_date || null,
    payment_method_label: parsed.data.payment_method_label || null,
    payment_status: parsed.data.payment_status,
    currency: parsed.data.currency.toUpperCase(),
    total_net: parsed.data.total_net ?? null,
    total_vat: parsed.data.total_vat ?? null,
    total_gross: parsed.data.total_gross ?? null,
    pdf_url: parsed.data.pdf_url || null,
    pdf_storage_path: parsed.data.pdf_storage_path || null,
    raw_payload: parsed.data.raw_payload ?? body ?? {},
  }

  const { data: existing } = await auth.supabase
    .from('order_invoices')
    .select('id')
    .eq('tenant_id', auth.integration.tenant_id)
    .eq('order_id', order.id)
    .eq('invoice_number', parsed.data.invoice_number)
    .maybeSingle()

  const { data: invoice, error } = existing
    ? await auth.supabase.from('order_invoices').update(payload).eq('id', existing.id).select('id').single()
    : await auth.supabase.from('order_invoices').insert(payload).select('id').single()

  if (error) {
    await auth.supabase.from('integration_sync_logs').insert({
      tenant_id: auth.integration.tenant_id,
      integration_id: auth.integration.id,
      direction: 'inbound',
      entity_type: 'invoice',
      entity_id: order.id,
      operation: 'upsert_invoice',
      status: 'error',
      message: error.message,
      payload: body ?? {},
    })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await auth.supabase
    .from('tenant_integrations')
    .update({ last_invoice_import_at: new Date().toISOString(), last_error: null })
    .eq('id', auth.integration.id)

  await auth.supabase
    .from('orders')
    .update({
      integration_id: auth.integration.id,
      external_order_status: 'invoice_received',
      external_payload: { last_invoice_number: parsed.data.invoice_number },
    })
    .eq('id', order.id)

  await auth.supabase.from('integration_sync_logs').insert({
    tenant_id: auth.integration.tenant_id,
    integration_id: auth.integration.id,
    direction: 'inbound',
    entity_type: 'invoice',
    entity_id: invoice.id,
    operation: 'upsert_invoice',
    status: 'success',
    message: `Invoice ${parsed.data.invoice_number} linked to order ${order.order_number}`,
    payload: body ?? {},
  })

  return NextResponse.json({
    success: true,
    invoice_id: invoice.id,
    order_id: order.id,
    order_number: order.order_number,
  })
}
