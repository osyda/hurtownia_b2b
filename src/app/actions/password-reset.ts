'use server'

import { headers } from 'next/headers'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import {
  getTenantSlugFromHost,
  isLegacyPlatformAppHost,
  isPlatformMarketingHost,
} from '@/lib/shop-routing'
import { isDostawioHost } from '@/lib/supabase/cookies'

type PasswordResetState = {
  success?: boolean
  error?: string
}

const resetSchema = z.object({
  email: z.string().trim().email('Podaj poprawny adres e-mail.'),
})

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function requestOrigin(host: string | null, forwardedProto: string | null) {
  const protocol = forwardedProto?.split(',')[0]?.trim() || 'https'
  return `${protocol}://${host}`
}

async function findAuthUserByEmail(
  adminSupabase: Awaited<ReturnType<typeof createAdminClient>>,
  email: string
) {
  const target = normalizeEmail(email)

  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await adminSupabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    })

    if (error) throw error

    const user = data.users.find(item => normalizeEmail(item.email ?? '') === target)
    if (user) return user
    if (data.users.length < 1000) return null
  }

  return null
}

async function canSendResetForHost(
  adminSupabase: Awaited<ReturnType<typeof createAdminClient>>,
  userId: string,
  host: string | null
) {
  const tenantHostSlug = getTenantSlugFromHost(host)
  const isPlatformHost = isPlatformMarketingHost(host) || isLegacyPlatformAppHost(host)

  const { data: profile } = await adminSupabase
    .from('user_profiles')
    .select('role, tenant_id')
    .eq('id', userId)
    .maybeSingle()

  if (!profile) return false

  if (tenantHostSlug) {
    if ((profile.role === 'tenant_admin' || profile.role === 'tenant_employee') && profile.tenant_id) {
      const { data: tenant } = await adminSupabase
        .from('tenants')
        .select('slug')
        .eq('id', profile.tenant_id)
        .maybeSingle()

      return tenant?.slug === tenantHostSlug
    }

    if (profile.role === 'customer') {
      const { data: customer } = await adminSupabase
        .from('customers')
        .select('tenants(slug)')
        .eq('user_id', userId)
        .maybeSingle()

      const tenantSlug = (customer?.tenants as unknown as { slug: string } | null)?.slug
      return tenantSlug === tenantHostSlug
    }

    return false
  }

  if (isPlatformHost) return profile.role === 'super_admin'

  return !isDostawioHost(host)
}

export async function requestPasswordResetAction(
  _prevState: PasswordResetState,
  formData: FormData
): Promise<PasswordResetState> {
  const parsed = resetSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const headersList = await headers()
  const host = headersList.get('host')
  if (!host) return { error: 'Nie udało się rozpoznać adresu aplikacji.' }

  const email = normalizeEmail(parsed.data.email)
  const adminSupabase = await createAdminClient()

  try {
    const user = await findAuthUserByEmail(adminSupabase, email)
    if (!user) return { success: true }

    const allowed = await canSendResetForHost(adminSupabase, user.id, host)
    if (!allowed) return { success: true }

    const { error } = await adminSupabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${requestOrigin(host, headersList.get('x-forwarded-proto'))}/reset-password`,
    })

    if (error) {
      console.error('[password-reset] Supabase reset email failed', error)
      return { error: 'Nie udało się wysłać linku resetującego. Sprawdź konfigurację adresów URL w Supabase.' }
    }

    return { success: true }
  } catch (error) {
    console.error('[password-reset] Request failed', error)
    return { error: 'Nie udało się obsłużyć resetu hasła. Spróbuj ponownie.' }
  }
}
