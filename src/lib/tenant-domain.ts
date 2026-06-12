import { createAdminClient } from '@/lib/supabase/server'
import { getTenantSlugFromHost, isLikelyCustomDomainHost, normalizeCustomDomain } from '@/lib/shop-routing'

export interface TenantDomainContext {
  id: string | null
  slug: string
  name: string | null
  custom_domain: string | null
  custom_domain_status: string | null
}

export async function resolveTenantContextFromHost(host: string | null | undefined): Promise<TenantDomainContext | null> {
  const subdomainSlug = getTenantSlugFromHost(host)

  if (subdomainSlug) {
    return {
      id: null,
      slug: subdomainSlug,
      name: null,
      custom_domain: null,
      custom_domain_status: null,
    }
  }

  if (!isLikelyCustomDomainHost(host)) return null

  const customDomain = normalizeCustomDomain(host)
  if (!customDomain) return null

  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('tenants')
    .select('id, name, slug, custom_domain, custom_domain_status')
    .eq('custom_domain', customDomain)
    .in('custom_domain_status', ['pending_dns', 'active'])
    .maybeSingle()

  return data ?? null
}
