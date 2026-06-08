'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const customerSchema = z.object({
  company_name: z.string().min(1, 'Nazwa firmy jest wymagana'),
  nip: z.string().optional(),
  email: z.string().email('Nieprawidłowy e-mail'),
  phone: z.string().optional(),
  status: z.enum(['active', 'inactive', 'pending']),
  price_group_id: z.string().optional(),
  min_order_value: z.coerce.number().min(0).default(0),
  internal_notes: z.string().optional(),
  invoice_street: z.string().optional(),
  invoice_city: z.string().optional(),
  invoice_postal_code: z.string().optional(),
})

async function getTenantId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('user_profiles').select('tenant_id').eq('id', user.id).single()
  return data?.tenant_id ?? null
}

function getPaymentMethodIds(formData: FormData) {
  return Array.from(new Set(
    formData
      .getAll('payment_method_ids')
      .filter((value): value is string => typeof value === 'string' && value.length > 0)
  ))
}

async function validatePaymentMethodIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string,
  paymentMethodIds: string[]
) {
  if (!paymentMethodIds.length) return { ok: true as const }

  const { data, error } = await supabase
    .from('payment_methods')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .in('id', paymentMethodIds)

  if (error) return { ok: false as const, error: error.message }

  const validIds = new Set((data ?? []).map(method => method.id))
  const hasInvalidMethod = paymentMethodIds.some(id => !validIds.has(id))
  if (hasInvalidMethod) {
    return { ok: false as const, error: 'Wybrano niedostępną formę płatności' }
  }

  return { ok: true as const }
}

async function syncCustomerPaymentMethods(
  supabase: Awaited<ReturnType<typeof createClient>>,
  customerId: string,
  paymentMethodIds: string[]
) {
  const { error: deleteError } = await supabase
    .from('customer_payment_methods')
    .delete()
    .eq('customer_id', customerId)

  if (deleteError) return { error: deleteError.message }
  if (!paymentMethodIds.length) return {}

  const { error: insertError } = await supabase
    .from('customer_payment_methods')
    .insert(paymentMethodIds.map(paymentMethodId => ({
      customer_id: customerId,
      payment_method_id: paymentMethodId,
    })))

  if (insertError) return { error: insertError.message }
  return {}
}

export async function createCustomer(tenantSlug: string, formData: FormData) {
  const supabase = await createClient()
  const tenantId = await getTenantId(supabase)
  if (!tenantId) redirect('/login')

  const raw = Object.fromEntries(formData)
  const parsed = customerSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const d = parsed.data
  const paymentMethodIds = getPaymentMethodIds(formData)
  const paymentValidation = await validatePaymentMethodIds(supabase, tenantId, paymentMethodIds)
  if (!paymentValidation.ok) return { error: paymentValidation.error }

  const invoiceAddress = d.invoice_street ? {
    street: d.invoice_street,
    city: d.invoice_city || '',
    postal_code: d.invoice_postal_code || '',
    country: 'PL',
  } : null

  const { data: customer, error } = await supabase.from('customers').insert({
    tenant_id: tenantId,
    company_name: d.company_name,
    nip: d.nip || null,
    email: d.email,
    phone: d.phone || null,
    status: d.status,
    price_group_id: d.price_group_id || null,
    min_order_value: d.min_order_value,
    internal_notes: d.internal_notes || null,
    invoice_address: invoiceAddress,
  }).select('id').single()

  if (error) return { error: error.message }

  const paymentSync = await syncCustomerPaymentMethods(supabase, customer.id, paymentMethodIds)
  if (paymentSync.error) return { error: paymentSync.error }

  revalidatePath(`/${tenantSlug}/customers`)
  redirect(`/${tenantSlug}/customers`)
}

export async function updateCustomer(tenantSlug: string, customerId: string, formData: FormData) {
  const supabase = await createClient()
  const tenantId = await getTenantId(supabase)
  if (!tenantId) redirect('/login')

  const raw = Object.fromEntries(formData)
  const parsed = customerSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const d = parsed.data
  const paymentMethodIds = getPaymentMethodIds(formData)
  const paymentValidation = await validatePaymentMethodIds(supabase, tenantId, paymentMethodIds)
  if (!paymentValidation.ok) return { error: paymentValidation.error }

  const invoiceAddress = d.invoice_street ? {
    street: d.invoice_street,
    city: d.invoice_city || '',
    postal_code: d.invoice_postal_code || '',
    country: 'PL',
  } : null

  const { error } = await supabase.from('customers').update({
    company_name: d.company_name,
    nip: d.nip || null,
    email: d.email,
    phone: d.phone || null,
    status: d.status,
    price_group_id: d.price_group_id || null,
    min_order_value: d.min_order_value,
    internal_notes: d.internal_notes || null,
    invoice_address: invoiceAddress,
  }).eq('id', customerId).eq('tenant_id', tenantId)

  if (error) return { error: error.message }

  const paymentSync = await syncCustomerPaymentMethods(supabase, customerId, paymentMethodIds)
  if (paymentSync.error) return { error: paymentSync.error }

  revalidatePath(`/${tenantSlug}/customers`)
  revalidatePath(`/${tenantSlug}/customers/${customerId}`)
  redirect(`/${tenantSlug}/customers`)
}
