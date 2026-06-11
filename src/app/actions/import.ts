'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function getTenantId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('user_profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()
  return data?.tenant_id ?? null
}

interface ImportRow {
  sku?: string
  name?: string
  unit?: string
  base_price?: number
  vat_rate?: number
  stock_qty?: number
  stock_status?: string
  category_name?: string
  description?: string
  image_url?: string
  min_order_qty?: number
  order_multiple?: number
}

export async function importProducts(tenantSlug: string, rows: ImportRow[]) {
  const supabase = await createClient()
  const tenantId = await getTenantId(supabase)
  if (!tenantId) redirect('/login')

  let successRows = 0
  const errors: string[] = []

  // Create import log
  const { data: logEntry } = await supabase.from('import_logs').insert({
    tenant_id: tenantId,
    import_type: 'products',
    records_total: rows.length,
    records_ok: 0,
    records_failed: 0,
  }).select('id').single()

  // Get existing categories for lookup
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('tenant_id', tenantId)

  const categoryMap = new Map(categories?.map(c => [c.name.toLowerCase(), c.id]) ?? [])

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2 // +2 because row 1 is header

    if (!row.name) {
      errors.push(`Wiersz ${rowNum}: brak nazwy produktu`)
      continue
    }

    let categoryId: string | null = null
    if (row.category_name) {
      categoryId = categoryMap.get(row.category_name.toLowerCase()) ?? null
      if (!categoryId) {
        // Auto-create category
        const { data: newCat } = await supabase.from('categories').insert({
          tenant_id: tenantId,
          name: row.category_name,
          is_active: true,
        }).select('id').single()
        if (newCat) {
          categoryId = newCat.id
          categoryMap.set(row.category_name.toLowerCase(), newCat.id)
        }
      }
    }

    const productData = {
      tenant_id: tenantId,
      name: row.name,
      sku: row.sku || null,
      description: row.description || null,
      image_url: row.image_url || null,
      category_id: categoryId,
      unit: row.unit || 'szt',
      base_price: row.base_price ?? 0,
      vat_rate: row.vat_rate ?? 23,
      min_order_qty: row.min_order_qty ?? 1,
      order_multiple: row.order_multiple ?? 1,
      stock_quantity: row.stock_qty ?? 0,
      stock_status: (row.stock_status as 'available' | 'unavailable' | 'limited') || 'available',
      status: 'active' as const,
    }

    if (row.sku) {
      // Try to update existing product by SKU
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('sku', row.sku)
        .single()

      if (existing) {
        const { error } = await supabase.from('products')
          .update(productData)
          .eq('id', existing.id)
        if (error) { errors.push(`Wiersz ${rowNum}: ${error.message}`); continue }
        successRows++
        continue
      }
    }

    // Insert new product
    const { error } = await supabase.from('products').insert(productData)
    if (error) {
      errors.push(`Wiersz ${rowNum}: ${error.message}`)
    } else {
      successRows++
    }
  }

  // Update import log
  if (logEntry) {
    await supabase.from('import_logs').update({
      records_ok: successRows,
      records_failed: errors.length,
      errors: errors.length > 0 ? errors : null,
    }).eq('id', logEntry.id)
  }

  revalidatePath(`/${tenantSlug}/products`)
  revalidatePath(`/${tenantSlug}/import`)

  return {
    success: successRows,
    errors,
    total: rows.length,
  }
}

export async function importStockLevels(tenantSlug: string, rows: { sku: string; stock_qty: number; stock_status?: string }[]) {
  const supabase = await createClient()
  const tenantId = await getTenantId(supabase)
  if (!tenantId) redirect('/login')

  let successRows = 0
  const errors: string[] = []

  const { data: logEntry } = await supabase.from('import_logs').insert({
    tenant_id: tenantId,
    import_type: 'stock',
    records_total: rows.length,
    records_ok: 0,
    records_failed: 0,
  }).select('id').single()

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2

    if (!row.sku) {
      errors.push(`Wiersz ${rowNum}: brak SKU`)
      continue
    }

    const { error } = await supabase.from('products')
      .update({
        stock_quantity: row.stock_qty,
        stock_status: (row.stock_status as 'available' | 'unavailable' | 'limited') || 'available',
      })
      .eq('tenant_id', tenantId)
      .eq('sku', row.sku)

    if (error) {
      errors.push(`Wiersz ${rowNum} (${row.sku}): ${error.message}`)
    } else {
      successRows++
    }
  }

  if (logEntry) {
    await supabase.from('import_logs').update({
      records_ok: successRows,
      records_failed: errors.length,
      errors: errors.length > 0 ? errors : null,
    }).eq('id', logEntry.id)
  }

  revalidatePath(`/${tenantSlug}/products`)
  revalidatePath(`/${tenantSlug}/import`)

  return { success: successRows, errors, total: rows.length }
}
