'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { slugify } from '@/lib/utils'
import { sendCustomerInviteEmail } from '@/lib/email'

async function requireSuperAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data } = await supabase.from('user_profiles').select('role').eq('id', user.id).single()
  if (data?.role !== 'super_admin') redirect('/admin/dashboard')
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
  const supabase = await createClient()
  await requireSuperAdmin(supabase)

  const rawSlug = String(formData.get('slug') || '').trim() || slugify(String(formData.get('name') || ''))
  formData.set('slug', rawSlug)

  const parsed = tenantSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const adminParsed = adminUserSchema.safeParse(Object.fromEntries(formData))
  if (!adminParsed.success) return { error: adminParsed.error.errors[0].message }

  // Check slug uniqueness
  const { data: existing } = await supabase.from('tenants').select('id').eq('slug', parsed.data.slug).single()
  if (existing) return { error: `Slug "${parsed.data.slug}" jest już zajęty` }

  // Create tenant
  const { data: tenant, error: tenantError } = await supabase.from('tenants').insert({
    name: parsed.data.name,
    slug: parsed.data.slug,
    brand_color: parsed.data.brand_color,
    contact_email: parsed.data.contact_email || null,
    status: 'active',
  }).select('id').single()

  if (tenantError || !tenant) return { error: tenantError?.message ?? 'Błąd tworzenia hurtowni' }

  // Create admin user via Admin API
  const adminSupabase = await createAdminClient()
  const { data: newUser, error: userError } = await adminSupabase.auth.admin.createUser({
    email: adminParsed.data.email,
    password: adminParsed.data.password,
    email_confirm: true,
    user_metadata: { full_name: adminParsed.data.full_name },
  })

  if (userError || !newUser.user) {
    // Rollback tenant
    await supabase.from('tenants').delete().eq('id', tenant.id)
    return { error: userError?.message ?? 'Błąd tworzenia użytkownika' }
  }

  // Create user profile
  const { error: profileError } = await supabase.from('user_profiles').insert({
    id: newUser.user.id,
    tenant_id: tenant.id,
    full_name: adminParsed.data.full_name,
    email: adminParsed.data.email,
    role: 'tenant_admin',
  })

  if (profileError) {
    await adminSupabase.auth.admin.deleteUser(newUser.user.id)
    await supabase.from('tenants').delete().eq('id', tenant.id)
    return { error: profileError.message }
  }

  revalidatePath('/admin/tenants')
  return { success: true, tenantId: tenant.id }
}

export async function updateTenantStatus(tenantId: string, status: 'active' | 'inactive' | 'suspended') {
  const supabase = await createClient()
  await requireSuperAdmin(supabase)

  const { error } = await supabase.from('tenants')
    .update({ status })
    .eq('id', tenantId)

  if (error) return { error: error.message }
  revalidatePath('/admin/tenants')
  return { success: true }
}

export async function inviteCustomerUser(
  tenantSlug: string,
  customerId: string,
  email: string,
  password: string
) {
  const supabase = await createClient()
  const adminSupabase = await createAdminClient()

  const { data: { user: caller } } = await supabase.auth.getUser()
  if (!caller) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tenant_id, role')
    .eq('id', caller.id)
    .single()

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
  const { error: customerError } = await supabase.from('customers')
    .update({ user_id: newUser.user.id })
    .eq('id', customerId)

  if (customerError) {
    await adminSupabase.auth.admin.deleteUser(newUser.user.id)
    return { error: customerError.message }
  }

  // Create user profile with role=customer
  const { data: customer } = await supabase
    .from('customers')
    .select('company_name, tenant_id, tenants(name)')
    .eq('id', customerId)
    .single()

  await supabase.from('user_profiles').insert({
    id: newUser.user.id,
    tenant_id: customer?.tenant_id ?? profile.tenant_id,
    email,
    full_name: (customer?.company_name ?? 'Klient'),
    role: 'customer',
  })

  // Send invite email
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
