'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const productSchema = z.object({
  name: z.string().min(1, 'Nazwa jest wymagana'),
  sku: z.string().optional(),
  description: z.string().optional(),
  image_url: z.string().url('Podaj poprawny adres URL zdjęcia').or(z.literal('')).optional(),
  category_id: z.string().optional(),
  unit: z.string().min(1, 'Jednostka jest wymagana'),
  base_price: z.coerce.number().min(0),
  vat_rate: z.coerce.number().min(0).max(100),
  min_order_qty: z.coerce.number().min(0),
  order_multiple: z.coerce.number().min(0),
  stock_status: z.enum(['available', 'unavailable', 'limited']),
  status: z.enum(['active', 'inactive']),
})

async function getTenantId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('user_profiles').select('tenant_id').eq('id', user.id).single()
  return data?.tenant_id ?? null
}

export async function createProduct(tenantSlug: string, formData: FormData) {
  const supabase = await createClient()
  const tenantId = await getTenantId(supabase)
  if (!tenantId) redirect('/login')

  const raw = Object.fromEntries(formData)
  const parsed = productSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const data = parsed.data
  const { error } = await supabase.from('products').insert({
    tenant_id: tenantId,
    name: data.name,
    sku: data.sku || null,
    description: data.description || null,
    image_url: data.image_url || null,
    category_id: data.category_id || null,
    unit: data.unit,
    base_price: data.base_price,
    vat_rate: data.vat_rate,
    min_order_qty: data.min_order_qty,
    order_multiple: data.order_multiple,
    stock_status: data.stock_status,
    status: data.status,
  })

  if (error) return { error: error.message }
  revalidatePath(`/${tenantSlug}/products`)
  redirect(`/${tenantSlug}/products`)
}

export async function updateProduct(tenantSlug: string, productId: string, formData: FormData) {
  const supabase = await createClient()
  const tenantId = await getTenantId(supabase)
  if (!tenantId) redirect('/login')

  const raw = Object.fromEntries(formData)
  const parsed = productSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const data = parsed.data
  const { error } = await supabase.from('products').update({
    name: data.name,
    sku: data.sku || null,
    description: data.description || null,
    image_url: data.image_url || null,
    category_id: data.category_id || null,
    unit: data.unit,
    base_price: data.base_price,
    vat_rate: data.vat_rate,
    min_order_qty: data.min_order_qty,
    order_multiple: data.order_multiple,
    stock_status: data.stock_status,
    status: data.status,
  }).eq('id', productId).eq('tenant_id', tenantId)

  if (error) return { error: error.message }
  revalidatePath(`/${tenantSlug}/products`)
  redirect(`/${tenantSlug}/products`)
}

export async function deleteProduct(tenantSlug: string, productId: string) {
  const supabase = await createClient()
  const tenantId = await getTenantId(supabase)
  if (!tenantId) redirect('/login')

  const { error } = await supabase.from('products')
    .delete()
    .eq('id', productId)
    .eq('tenant_id', tenantId)

  if (error) return { error: error.message }
  revalidatePath(`/${tenantSlug}/products`)
  return { success: true }
}
