'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

async function getTenantContext(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('user_profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()
  return data ?? null
}

const tenantSettingsSchema = z.object({
  name: z.string().min(1, 'Nazwa jest wymagana'),
  contact_email: z.string().email('Nieprawidłowy email').optional().or(z.literal('')),
  contact_phone: z.string().optional(),
  brand_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Nieprawidłowy kolor'),
})

export async function updateTenantSettings(tenantSlug: string, formData: FormData) {
  const supabase = await createClient()
  const ctx = await getTenantContext(supabase)
  if (!ctx?.tenant_id) redirect('/login')
  if (ctx.role !== 'tenant_admin') return { error: 'Brak uprawnień' }

  const raw = Object.fromEntries(formData)
  const parsed = tenantSettingsSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const { error } = await supabase.from('tenants').update({
    name: parsed.data.name,
    contact_email: parsed.data.contact_email || null,
    contact_phone: parsed.data.contact_phone || null,
    brand_color: parsed.data.brand_color,
  }).eq('id', ctx.tenant_id)

  if (error) return { error: error.message }
  revalidatePath(`/${tenantSlug}/settings`)
  return { success: true }
}

const deliverySchema = z.object({
  min_order_value: z.coerce.number().min(0),
  delivery_days: z.string().optional(),
  order_cutoff_time: z.string().optional(),
  customer_info: z.string().optional(),
})

export async function upsertDeliverySettings(tenantSlug: string, formData: FormData) {
  const supabase = await createClient()
  const ctx = await getTenantContext(supabase)
  if (!ctx?.tenant_id) redirect('/login')
  if (ctx.role !== 'tenant_admin') return { error: 'Brak uprawnień' }

  const raw = Object.fromEntries(formData)
  const parsed = deliverySchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const deliveryDays = parsed.data.delivery_days
    ? parsed.data.delivery_days.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d))
    : []

  const { data: existing } = await supabase
    .from('delivery_settings')
    .select('id')
    .eq('tenant_id', ctx.tenant_id)
    .single()

  const payload = {
    tenant_id: ctx.tenant_id,
    min_order_value: parsed.data.min_order_value,
    delivery_days: deliveryDays,
    order_cutoff_time: parsed.data.order_cutoff_time || null,
    customer_info: parsed.data.customer_info || null,
  }

  const { error } = existing
    ? await supabase.from('delivery_settings').update(payload).eq('id', existing.id)
    : await supabase.from('delivery_settings').insert(payload)

  if (error) return { error: error.message }
  revalidatePath(`/${tenantSlug}/settings`)
  return { success: true }
}

const paymentMethodSchema = z.object({
  label: z.string().min(1, 'Nazwa jest wymagana'),
  type: z.enum(['cash', 'bank_transfer', 'card', 'blik', 'credit']),
  is_active: z.coerce.boolean().optional(),
})

export async function createPaymentMethod(tenantSlug: string, formData: FormData) {
  const supabase = await createClient()
  const ctx = await getTenantContext(supabase)
  if (!ctx?.tenant_id) redirect('/login')
  if (ctx.role !== 'tenant_admin') return { error: 'Brak uprawnień' }

  const raw = Object.fromEntries(formData)
  const parsed = paymentMethodSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const { error } = await supabase.from('payment_methods').insert({
    tenant_id: ctx.tenant_id,
    label: parsed.data.label,
    type: parsed.data.type,
    is_active: true,
  })

  if (error) return { error: error.message }
  revalidatePath(`/${tenantSlug}/settings`)
  return { success: true }
}

export async function togglePaymentMethod(tenantSlug: string, methodId: string, isActive: boolean) {
  const supabase = await createClient()
  const ctx = await getTenantContext(supabase)
  if (!ctx?.tenant_id) redirect('/login')

  const { error } = await supabase.from('payment_methods')
    .update({ is_active: isActive })
    .eq('id', methodId)
    .eq('tenant_id', ctx.tenant_id)

  if (error) return { error: error.message }
  revalidatePath(`/${tenantSlug}/settings`)
  return { success: true }
}

export async function deletePaymentMethod(tenantSlug: string, methodId: string) {
  const supabase = await createClient()
  const ctx = await getTenantContext(supabase)
  if (!ctx?.tenant_id) redirect('/login')
  if (ctx.role !== 'tenant_admin') return { error: 'Brak uprawnień' }

  const { error } = await supabase.from('payment_methods')
    .delete()
    .eq('id', methodId)
    .eq('tenant_id', ctx.tenant_id)

  if (error) return { error: error.message }
  revalidatePath(`/${tenantSlug}/settings`)
  return { success: true }
}
