'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

async function getTenantCtx(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('user_profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()
  return data ?? null
}

const groupSchema = z.object({
  name: z.string().min(1, 'Nazwa jest wymagana'),
  description: z.string().optional(),
  discount_percent: z.coerce.number().min(0).max(100).optional(),
})

export async function createPriceGroup(tenantSlug: string, formData: FormData) {
  const supabase = await createClient()
  const ctx = await getTenantCtx(supabase)
  if (!ctx?.tenant_id) redirect('/login')

  const parsed = groupSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const { error } = await supabase.from('price_groups').insert({
    tenant_id: ctx.tenant_id,
    name: parsed.data.name,
    description: parsed.data.description || null,
    discount_percent: parsed.data.discount_percent ?? 0,
  })
  if (error) return { error: error.message }
  revalidatePath(`/${tenantSlug}/prices`)
  return { success: true }
}

export async function updatePriceGroup(tenantSlug: string, groupId: string, formData: FormData) {
  const supabase = await createClient()
  const ctx = await getTenantCtx(supabase)
  if (!ctx?.tenant_id) redirect('/login')

  const parsed = groupSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const { error } = await supabase.from('price_groups')
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
      discount_percent: parsed.data.discount_percent ?? 0,
    })
    .eq('id', groupId)
    .eq('tenant_id', ctx.tenant_id)
  if (error) return { error: error.message }
  revalidatePath(`/${tenantSlug}/prices`)
  return { success: true }
}

export async function deletePriceGroup(tenantSlug: string, groupId: string) {
  const supabase = await createClient()
  const ctx = await getTenantCtx(supabase)
  if (!ctx?.tenant_id) redirect('/login')

  const { error } = await supabase.from('price_groups')
    .delete()
    .eq('id', groupId)
    .eq('tenant_id', ctx.tenant_id)
  if (error) return { error: error.message }
  revalidatePath(`/${tenantSlug}/prices`)
  return { success: true }
}

export async function upsertProductPrice(
  tenantSlug: string,
  productId: string,
  customerId: string | null,
  priceGroupId: string | null,
  priceNet: number | null
) {
  const supabase = await createClient()
  const ctx = await getTenantCtx(supabase)
  if (!ctx?.tenant_id) redirect('/login')

  // Delete if price is null (reset to default)
  if (priceNet === null) {
    await supabase.from('product_prices')
      .delete()
      .eq('tenant_id', ctx.tenant_id)
      .eq('product_id', productId)
      .eq('customer_id', customerId ?? '')
    revalidatePath(`/${tenantSlug}/prices`)
    return { success: true }
  }

  const existing = await supabase.from('product_prices')
    .select('id')
    .eq('tenant_id', ctx.tenant_id)
    .eq('product_id', productId)
    .eq(customerId ? 'customer_id' : 'price_group_id', customerId ?? priceGroupId ?? '')
    .single()

  const payload = {
    tenant_id: ctx.tenant_id,
    product_id: productId,
    customer_id: customerId,
    price_group_id: priceGroupId,
    price_net: priceNet,
  }

  const { error } = existing.data
    ? await supabase.from('product_prices').update({ price_net: priceNet }).eq('id', existing.data.id)
    : await supabase.from('product_prices').insert(payload)

  if (error) return { error: error.message }
  revalidatePath(`/${tenantSlug}/prices`)
  return { success: true }
}

export async function assignCustomerToGroup(tenantSlug: string, customerId: string, priceGroupId: string | null) {
  const supabase = await createClient()
  const ctx = await getTenantCtx(supabase)
  if (!ctx?.tenant_id) redirect('/login')

  const { error } = await supabase.from('customers')
    .update({ price_group_id: priceGroupId })
    .eq('id', customerId)
    .eq('tenant_id', ctx.tenant_id)

  if (error) return { error: error.message }
  revalidatePath(`/${tenantSlug}/prices`)
  return { success: true }
}
