'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  getPlatformSiteUrl,
  getTenantPanelUrl,
  getTenantShopUrl,
  getTenantSlugFromHost,
  hostMatchesTenantDomain,
  isLikelyCustomDomainHost,
  isLegacyPlatformAppHost,
  isPlatformMarketingHost,
} from '@/lib/shop-routing'
import { isDostawioHost } from '@/lib/supabase/cookies'

const invalidCredentialsMessage = 'Nieprawidłowy e-mail lub hasło'

function platformDashboardRedirect(host: string | null) {
  return isDostawioHost(host) ? getPlatformSiteUrl('/dashboard') : '/dashboard'
}

function tenantPanelRedirect(tenantSlug: string, host: string | null) {
  if (getTenantSlugFromHost(host) === tenantSlug) return '/dashboard'

  return isDostawioHost(host) ? getTenantPanelUrl(tenantSlug, 'dashboard') : `/${tenantSlug}/dashboard`
}

function tenantShopRedirect(tenantSlug: string, host: string | null) {
  if (getTenantSlugFromHost(host) === tenantSlug) return '/'

  return isDostawioHost(host) ? getTenantShopUrl(tenantSlug) : `/sklep/${tenantSlug}`
}

function tenantPanelRedirectForHost(
  tenant: { slug: string; custom_domain?: string | null; custom_domain_status?: string | null },
  host: string | null
) {
  if (hostMatchesTenantDomain(host, tenant)) return '/dashboard'
  if (tenant.custom_domain && tenant.custom_domain_status === 'active') return `https://${tenant.custom_domain}/dashboard`
  return tenantPanelRedirect(tenant.slug, host)
}

function tenantShopRedirectForHost(
  tenant: { slug: string; custom_domain?: string | null; custom_domain_status?: string | null },
  host: string | null
) {
  if (hostMatchesTenantDomain(host, tenant)) return '/'
  if (tenant.custom_domain && tenant.custom_domain_status === 'active') return `https://${tenant.custom_domain}`
  return tenantShopRedirect(tenant.slug, host)
}

async function signOutWithError(supabase: Awaited<ReturnType<typeof createClient>>, error: string) {
  await supabase.auth.signOut()
  return { error }
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
  const host = (await headers()).get('host')
  const tenantHostSlug = getTenantSlugFromHost(host)
  const isPlatformLoginHost = isPlatformMarketingHost(host) || isLegacyPlatformAppHost(host)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: invalidCredentialsMessage }
  }

  const userId = data.user?.id

  if (!userId) {
    return signOutWithError(supabase, 'Nie udało się rozpoznać konta. Spróbuj ponownie.')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, tenant_id')
    .eq('id', userId)
    .maybeSingle()

  if (!profile) {
    return signOutWithError(supabase, 'Konto nie ma przypisanej roli w Dostawio.')
  }

  if (profile.role === 'super_admin') {
    redirect(platformDashboardRedirect(host))
  }

  if (isPlatformLoginHost) {
    return signOutWithError(
      supabase,
      'To wejście jest tylko dla właściciela Dostawio. Hurtownia i klient logują się na subdomenie swojej hurtowni, np. test.dostawio.pl/login.'
    )
  }

  if ((profile.role === 'tenant_admin' || profile.role === 'tenant_employee') && profile.tenant_id) {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('slug, custom_domain, custom_domain_status')
      .eq('id', profile.tenant_id)
      .maybeSingle()

    if (!tenant?.slug) {
      return signOutWithError(supabase, 'To konto nie ma przypisanej aktywnej hurtowni.')
    }

    if ((tenantHostSlug || isLikelyCustomDomainHost(host)) && !hostMatchesTenantDomain(host, tenant)) {
      return signOutWithError(supabase, invalidCredentialsMessage)
    }

    redirect(tenantPanelRedirectForHost(tenant, host))
  }

  if (profile.role === 'customer') {
    const { data: customer } = await supabase
      .from('customers')
      .select('tenants(slug, custom_domain, custom_domain_status)')
      .eq('user_id', userId)
      .maybeSingle()

    const tenant = customer?.tenants as unknown as { slug: string; custom_domain?: string | null; custom_domain_status?: string | null } | null

    if (!tenant?.slug) {
      return signOutWithError(supabase, 'To konto klienta nie jest przypisane do hurtowni.')
    }

    if ((tenantHostSlug || isLikelyCustomDomainHost(host)) && !hostMatchesTenantDomain(host, tenant)) {
      return signOutWithError(supabase, invalidCredentialsMessage)
    }

    redirect(tenantShopRedirectForHost(tenant, host))
  }

  return signOutWithError(supabase, 'Nieobsługiwana rola konta.')
}
