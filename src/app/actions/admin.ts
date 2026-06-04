'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { slugify } from '@/lib/utils'
import { sendCustomerInviteEmail } from '@/lib/email'

async function requireSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  if (data?.role !== 'super_admin') redirect('/login')
  return user
}

const tenantSchema = z.object({
  name: z.string().min(1, 'Nazwa jest wymagana'),
  slug: z.string().min(2, 'Slug jest wymagany').regex(/^[a-z0-9-]+$/, 'Tylko małe litery, cyfry i myślniki'),
  brand_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().default('#2563eb'),
  contact_email: z.string().email().optional().or(z.literal('')),
})

const adminUserSchema = z.object({
  email: z.string().email('Nieprawidłowy email'),
  password: z.string().min(8, 'Hasło musi mieć min. 8 znaków'),
  full_name: z.string().min(1, 'Imię i nazwisko jest wymagane'),
})

export async function createTenant(formData: FormData) {
  if (!process.env.SUPABASE_SECRET_KEY) {
    return { error: 'Brak SUPABASE_SECRET_KEY w konfiguracji Vercel — dodaj tę zmienną w Settings → Environment Variables' }
  }

  await requireSuperAdmin()

  const rawSlug = String(formData.get('slug') || '').trim() || slugify(String(formData.get('name') || ''))
  formData.set('slug', rawSlug)

  const parsed = tenantSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const adminParsed = adminUserSchema.safeParse(Object.fromEntries(formData))
  if (!adminParsed.success) return { error: adminParsed.error.errors[0].message }

  const adminSupabase = await createAdminClient()

  // Check slug uniqueness
  const { data: existing } = await adminSupabase
    .from('tenants')
    .select('id')
    .eq('slug', parsed.data.slug)
    .maybeSingle()
  if (existing) return { error: `Slug "${parsed.data.slug}" jest już zajęty` }

  // Create tenant via admin client (bypasses RLS)
  const { data: tenant, error: tenantError } = await adminSupabase
    .from('tenants')
    .insert({
      name: parsed.data.name,
      slug: parsed.data.slug,
      brand_color: parsed.data.brand_color,
      contact_email: parsed.data.contact_email || null,
      status: 'active',
    })
    .select('id')
    .single()

  if (tenantError || !tenant) return { error: tenantError?.message ?? 'Błąd tworzenia hurtowni' }

  // Create admin user via Auth Admin API
  const { data: newUser, error: userError } = await adminSupabase.auth.admin.createUser({
    email: adminParsed.data.email,
    password: adminParsed.data.password,
    email_confirm: true,
    user_metadata: { full_name: adminParsed.data.full_name },
  })

  if (userError || !newUser.user) {
    await adminSupabase.from('tenants').delete().eq('id', tenant.id)
    return { error: userError?.message ?? 'Błąd tworzenia konta użytkownika' }
  }

  // Split "Jan Kowalski" → first_name="Jan" last_name="Kowalski"
  const nameParts = adminParsed.data.full_name.trim().split(/\s+/)
  const firstName = nameParts[0]
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null

  // Create user profile via admin client (bypasses RLS)
  const { error: profileError } = await adminSupabase.from('user_profiles').insert({
    id: newUser.user.id,
    tenant_id: tenant.id,
    first_name: firstName,
    last_name: lastName,
    role: 'tenant_admin',
  })

  if (profileError) {
    await adminSupabase.auth.admin.deleteUser(newUser.user.id)
    await adminSupabase.from('tenants').delete().eq('id', tenant.id)
    return { error: profileError.message }
  }

  revalidatePath('/tenants')
  return { success: true, tenantId: tenant.id }
}

export async function updateTenantStatus(tenantId: string, status: 'active' | 'inactive' | 'suspended') {
  if (!process.env.SUPABASE_SECRET_KEY) {
    return { error: 'Brak SUPABASE_SECRET_KEY w konfiguracji serwera' }
  }

  await requireSuperAdmin()
  const adminSupabase = await createAdminClient()

  const { error } = await adminSupabase
    .from('tenants')
    .update({ status })
    .eq('id', tenantId)

  if (error) return { error: error.message }
  revalidatePath('/tenants')
  return { success: true }
}

export async function inviteCustomerUser(
  tenantSlug: string,
  customerId: string,
  email: string,
  password: string
) {
  if (!process.env.SUPABASE_SECRET_KEY) {
    return { error: 'Brak SUPABASE_SECRET_KEY w konfiguracji serwera' }
  }

  const supabase = await createClient()
  const adminSupabase = await createAdminClient()

  const { data: { user: caller } } = await supabase.auth.getUser()
  if (!caller) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tenant_id, role')
    .eq('id', caller.id)
    .maybeSingle()

  if (!profile || !['tenant_admin', 'tenant_employee', 'super_admin'].includes(profile.role)) {
    return { error: 'Brak uprawnień' }
  }

  // Create auth user
  const { data: newUser, error: userError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (userError || !newUser.user) return { error: userError?.message ?? 'Błąd tworzenia konta' }

  // Update customer with user_id
  const { error: customerError } = await adminSupabase
    .from('customers')
    .update({ user_id: newUser.user.id })
    .eq('id', customerId)

  if (customerError) {
    await adminSupabase.auth.admin.deleteUser(newUser.user.id)
    return { error: customerError.message }
  }

  // Get customer details
  const { data: customer } = await adminSupabase
    .from('customers')
    .select('company_name, tenant_id, tenants(name)')
    .eq('id', customerId)
    .maybeSingle()

  // Create user profile
  const { error: profileError } = await adminSupabase.from('user_profiles').insert({
    id: newUser.user.id,
    tenant_id: customer?.tenant_id ?? profile.tenant_id,
    first_name: customer?.company_name ?? 'Klient',
    role: 'customer',
  })

  if (profileError) {
    await adminSupabase.auth.admin.deleteUser(newUser.user.id)
    return { error: profileError.message }
  }

  // Send invite email (fire-and-forget)
  if (process.env.RESEND_API_KEY) {
    const tenantName = (customer?.tenants as unknown as { name: string } | null)?.name ?? 'Hurtownia'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hurtownia-b2b.vercel.app'
    sendCustomerInviteEmail({
      customerEmail: email,
      customerName: customer?.company_name ?? 'Klient',
      tenantName,
      loginUrl: `${appUrl}/login`,
    }).catch(() => {})
  }

  revalidatePath(`/${tenantSlug}/customers/${customerId}`)
  return { success: true }
}
