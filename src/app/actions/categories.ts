'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const categorySchema = z.object({
  name: z.string().min(1, 'Nazwa jest wymagana'),
  parent_id: z.string().optional(),
  sort_order: z.coerce.number().default(0),
  is_active: z.coerce.boolean().default(true),
})

async function getTenantId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('user_profiles').select('tenant_id').eq('id', user.id).single()
  return data?.tenant_id ?? null
}

export async function createCategory(tenantSlug: string, formData: FormData) {
  const supabase = await createClient()
  const tenantId = await getTenantId(supabase)
  if (!tenantId) redirect('/login')

  const raw = {
    name: formData.get('name'),
    parent_id: formData.get('parent_id'),
    sort_order: formData.get('sort_order') || '0',
    is_active: formData.get('is_active') === 'true',
  }
  const parsed = categorySchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const { error } = await supabase.from('categories').insert({
    tenant_id: tenantId,
    name: parsed.data.name,
    parent_id: parsed.data.parent_id || null,
    sort_order: parsed.data.sort_order,
    is_active: parsed.data.is_active,
  })

  if (error) return { error: error.message }
  revalidatePath(`/${tenantSlug}/categories`)
  return { success: true }
}

export async function updateCategory(tenantSlug: string, categoryId: string, formData: FormData) {
  const supabase = await createClient()
  const tenantId = await getTenantId(supabase)
  if (!tenantId) redirect('/login')

  const raw = {
    name: formData.get('name'),
    parent_id: formData.get('parent_id'),
    sort_order: formData.get('sort_order') || '0',
    is_active: formData.get('is_active') === 'true',
  }
  const parsed = categorySchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const { error } = await supabase.from('categories').update({
    name: parsed.data.name,
    parent_id: parsed.data.parent_id || null,
    sort_order: parsed.data.sort_order,
    is_active: parsed.data.is_active,
  }).eq('id', categoryId).eq('tenant_id', tenantId)

  if (error) return { error: error.message }
  revalidatePath(`/${tenantSlug}/categories`)
  return { success: true }
}

export async function deleteCategory(tenantSlug: string, categoryId: string) {
  const supabase = await createClient()
  const tenantId = await getTenantId(supabase)
  if (!tenantId) redirect('/login')

  const { error } = await supabase.from('categories')
    .delete()
    .eq('id', categoryId)
    .eq('tenant_id', tenantId)

  if (error) return { error: error.message }
  revalidatePath(`/${tenantSlug}/categories`)
  return { success: true }
}
