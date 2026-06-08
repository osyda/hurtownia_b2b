'use server'

import { createClient } from '@/lib/supabase/server'
import { generateIntegrationToken, hashIntegrationToken } from '@/lib/integrations/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const providerValues = [
  'generic_rest',
  'baselinker',
  'insert_subiekt',
  'comarch_optima',
  'comarch_xl',
  'enova365',
  'symfonia',
  'wapro',
  'custom',
] as const

const integrationSchema = z.object({
  id: z.string().uuid().optional().or(z.literal('')),
  name: z.string().min(2, 'Nazwa integracji jest wymagana'),
  provider: z.enum(providerValues),
  sync_mode: z.enum(['api_pull', 'webhook_push', 'middleware', 'manual']),
  is_active: z.coerce.boolean().default(false),
  base_url: z.string().optional(),
  external_warehouse_id: z.string().optional(),
  external_price_list_id: z.string().optional(),
  notes: z.string().optional(),
})

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
    return { error: 'Brak uprawnien do integracji' as const, supabase, userId: user.id, tenantId: profile.tenant_id }
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
    notes: formData.get('notes') || '',
  }

  const parsed = integrationSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const config = {
    base_url: parsed.data.base_url || null,
    external_warehouse_id: parsed.data.external_warehouse_id || null,
    external_price_list_id: parsed.data.external_price_list_id || null,
    notes: parsed.data.notes || null,
  }

  const payload = {
    tenant_id: ctx.tenantId,
    name: parsed.data.name,
    provider: parsed.data.provider,
    sync_mode: parsed.data.sync_mode,
    is_active: parsed.data.is_active,
    connection_status: parsed.data.is_active ? 'ready' : 'not_configured',
    config,
    updated_by: ctx.userId,
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
    })
    .eq('id', integrationId)
    .eq('tenant_id', ctx.tenantId)

  if (error) return { error: error.message }
  revalidatePath(`/${tenantSlug}/integrations`)
  return { success: true, token }
}
