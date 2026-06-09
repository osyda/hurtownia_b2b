'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  getTenantShopUrl,
  isPlatformMarketingHost,
  normalizeHost,
  PLATFORM_APP_URL,
} from '@/lib/shop-routing'
import { isDostawioHost } from '@/lib/supabase/cookies'

function appRedirect(path: string, host: string | null) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  return isDostawioHost(host) ? `${PLATFORM_APP_URL}${normalizedPath}` : normalizedPath
}

function customerShopRedirect(tenantSlug: string, host: string | null) {
  const normalizedHost = normalizeHost(host)

  if (normalizedHost === 'localhost' || normalizedHost.endsWith('.localhost')) {
    return `/sklep/${tenantSlug}`
  }

  return getTenantShopUrl(tenantSlug)
}

export async function loginAction(
  _prevState: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Podaj e-mail i hasło' }
  }

  const supabase = await createClient()
  const headersList = await headers()
  const host = headersList.get('host')
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Nieprawidłowy e-mail lub hasło' }
  }

  const userId = data.user?.id

  if (!userId) {
    redirect(isPlatformMarketingHost(host) ? appRedirect('/', host) : '/')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, tenant_id')
    .eq('id', userId)
    .maybeSingle()

  if (profile?.role === 'super_admin') {
    redirect(appRedirect('/dashboard', host))
  }

  if ((profile?.role === 'tenant_admin' || profile?.role === 'tenant_employee') && profile.tenant_id) {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('slug')
      .eq('id', profile.tenant_id)
      .maybeSingle()

    if (tenant?.slug) {
      redirect(appRedirect(`/${tenant.slug}/dashboard`, host))
    }
  }

  if (profile?.role === 'customer') {
    const { data: customer } = await supabase
      .from('customers')
      .select('tenants(slug)')
      .eq('user_id', userId)
      .maybeSingle()

    const tenantSlug = (customer?.tenants as unknown as { slug: string } | null)?.slug
    if (tenantSlug) {
      redirect(customerShopRedirect(tenantSlug, host))
    }
  }

  redirect(isPlatformMarketingHost(host) ? appRedirect('/', host) : '/')
}
