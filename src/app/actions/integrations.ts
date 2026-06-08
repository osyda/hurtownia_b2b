'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { generateIntegrationToken, hashIntegrationToken } from '@/lib/integrations/auth'
import { integrationProviderValues } from '@/lib/integrations/provider-profiles'
import { createClient } from '@/lib/supabase/server'

const syncModeValues = ['api_pull', 'webhook_push', 'middleware', 'manual'] as const
const customerIdStrategies = ['nip', 'email', 'external_id', 'manual'] as const
const productIdStrategies = ['sku', 'ean', 'external_id', 'manual'] as const

const optionalText = z.string().trim().max(2000).optional()
const optionalShortText = z.string().trim().max(240).optional()

const integrationSchema = z.object({
  id: z.string().uuid().optional().or(z.literal('')),
  name: z.string().trim().min(2, 'Nazwa integracji jest wymagana'),
  provider: z.enum(integrationProviderValues),
  sync_mode: z.enum(syncModeValues),
  is_active: z.coerce.boolean().default(false),
  base_url: z.string().trim().max(500).optional(),
  external_warehouse_id: optionalShortText,
  external_price_list_id: optionalShortText,
  external_customer_id_strategy: z.enum(customerIdStrategies).default('nip'),
  external_product_id_strategy: z.enum(productIdStrategies).default('sku'),
  order_status_mapping: optionalText,
  invoice_series: optionalShortText,
  technical_contact_name: optionalShortText,
  technical_contact_email: z.string().trim().email('Nieprawidłowy email techniczny').optional().or(z.literal('')),
  stock_sync_enabled: z.coerce.boolean().default(false),
  price_sync_enabled: z.coerce.boolean().default(false),
  invoice_sync_enabled: z.coerce.boolean().default(true),
  status_sync_enabled: z.coerce.boolean().default(true),
  notes: optionalText,
})

function nullable(value: string | undefined) {
  return value?.trim() ? value.trim() : null
}

async function getTenantContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) redirect('/login')
  if (profile.role !== 'tenant_admin' && profile.role !== 'tenant_employee') {
    return { error: 'Brak uprawnień do integracji' as const, supabase, userId: user.id, tenantId: profile.tenant_id }
  }

  return { supabase, userId: user.id, tenantId: profile.tenant_id }
}

export async function saveIntegration(tenantSlug: string, formData: FormData) {
  const ctx = await getTenantContext()
  if ('error' in ctx) return { error: ctx.error }

  const raw = {
    id: formData.get('id') || '',
    name: formData.get('name'),
    provider: formData.get('provider'),
    sync_mode: formData.get('sync_mode'),
    is_active: formData.get('is_active') === 'true',
    base_url: formData.get('base_url') || '',
    external_warehouse_id: formData.get('external_warehouse_id') || '',
    external_price_list_id: formData.get('external_price_list_id') || '',
    external_customer_id_strategy: formData.get('external_customer_id_strategy') || 'nip',
    external_product_id_strategy: formData.get('external_product_id_strategy') || 'sku',
    order_status_mapping: formData.get('order_status_mapping') || '',
    invoice_series: formData.get('invoice_series') || '',
    technical_contact_name: formData.get('technical_contact_name') || '',
    technical_contact_email: formData.get('technical_contact_email') || '',
    stock_sync_enabled: formData.get('stock_sync_enabled') === 'true',
    price_sync_enabled: formData.get('price_sync_enabled') === 'true',
    invoice_sync_enabled: formData.get('invoice_sync_enabled') === 'true',
    status_sync_enabled: formData.get('status_sync_enabled') === 'true',
    notes: formData.get('notes') || '',
  }

  const parsed = integrationSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const config = {
    base_url: nullable(parsed.data.base_url),
    external_warehouse_id: nullable(parsed.data.external_warehouse_id),
    external_price_list_id: nullable(parsed.data.external_price_list_id),
    external_customer_id_strategy: parsed.data.external_customer_id_strategy,
    external_product_id_strategy: parsed.data.external_product_id_strategy,
    order_status_mapping: nullable(parsed.data.order_status_mapping),
    invoice_series: nullable(parsed.data.invoice_series),
    technical_contact_name: nullable(parsed.data.technical_contact_name),
    technical_contact_email: nullable(parsed.data.technical_contact_email),
    stock_sync_enabled: parsed.data.stock_sync_enabled,
    price_sync_enabled: parsed.data.price_sync_enabled,
    invoice_sync_enabled: parsed.data.invoice_sync_enabled,
    status_sync_enabled: parsed.data.status_sync_enabled,
    notes: nullable(parsed.data.notes),
  }

  const payload = {
    tenant_id: ctx.tenantId,
    name: parsed.data.name,
    provider: parsed.data.provider,
    sync_mode: parsed.data.sync_mode,
    is_active: parsed.data.is_active,
    connection_status: parsed.data.is_active ? 'ready' : 'paused',
    config,
    updated_by: ctx.userId,
    last_error: null,
  }

  const query = parsed.data.id
    ? ctx.supabase.from('tenant_integrations').update(payload).eq('id', parsed.data.id).eq('tenant_id', ctx.tenantId)
    : ctx.supabase.from('tenant_integrations').insert({ ...payload, created_by: ctx.userId })

  const { error } = await query
  if (error) return { error: error.message }

  revalidatePath(`/${tenantSlug}/integrations`)
  return { success: true }
}

export async function rotateIntegrationToken(tenantSlug: string, integrationId: string) {
  const ctx = await getTenantContext()
  if ('error' in ctx) return { error: ctx.error }

  const token = generateIntegrationToken()
  const { error } = await ctx.supabase
    .from('tenant_integrations')
    .update({
      api_token_hash: hashIntegrationToken(token),
      connection_status: 'ready',
      is_active: true,
      updated_by: ctx.userId,
      last_error: null,
    })
    .eq('id', integrationId)
    .eq('tenant_id', ctx.tenantId)

  if (error) return { error: error.message }
  revalidatePath(`/${tenantSlug}/integrations`)
  return { success: true, token }
}
