export const PLATFORM_DOMAIN = 'dostawio.pl'
export const PLATFORM_APP_SUBDOMAIN = 'app'
export const PLATFORM_APP_URL = `https://${PLATFORM_DOMAIN}`

const RESERVED_SUBDOMAINS = new Set([
  PLATFORM_APP_SUBDOMAIN,
  'www',
  'admin',
  'api',
  'assets',
  'cdn',
  'docs',
  'help',
  'mail',
  'panel',
  'static',
  'status',
  'support',
])

function normalizePath(path = '') {
  return path ? `/${path.replace(/^\//, '')}` : ''
}

export function normalizeHost(host: string | null | undefined) {
  return (host ?? '').split(':')[0]?.toLowerCase().replace(/\.$/, '') ?? ''
}

export function normalizeCustomDomain(value: string | null | undefined) {
  const withoutProtocol = (value ?? '').trim().replace(/^https?:\/\//i, '')
  const host = normalizeHost(withoutProtocol.split('/')[0])

  if (!host || host.startsWith('*.')) return ''
  return host
}

export function isLikelyCustomDomainHost(host: string | null | undefined) {
  const normalized = normalizeHost(host)

  if (!normalized || normalized === 'localhost' || normalized.endsWith('.localhost')) return false
  if (normalized === PLATFORM_DOMAIN || normalized.endsWith(`.${PLATFORM_DOMAIN}`)) return false
  return normalized.includes('.')
}

export function hostMatchesTenantDomain(
  host: string | null | undefined,
  tenant: { slug: string; custom_domain?: string | null; custom_domain_status?: string | null }
) {
  const tenantSlug = getTenantSlugFromHost(host)
  if (tenantSlug === tenant.slug) return true

  const customDomain = normalizeCustomDomain(tenant.custom_domain)
  return Boolean(
    customDomain &&
    tenant.custom_domain_status === 'active' &&
    normalizeHost(host) === customDomain
  )
}

export function isReservedTenantSlug(slug: string) {
  return RESERVED_SUBDOMAINS.has(slug.trim().toLowerCase())
}

export function isPlatformMarketingHost(host: string | null | undefined) {
  const normalized = normalizeHost(host)

  return normalized === PLATFORM_DOMAIN || normalized === `www.${PLATFORM_DOMAIN}`
}

export function isLegacyPlatformAppHost(host: string | null | undefined) {
  return normalizeHost(host) === `${PLATFORM_APP_SUBDOMAIN}.${PLATFORM_DOMAIN}`
}

export function getPlatformSiteUrl(path = '') {
  return `https://${PLATFORM_DOMAIN}${normalizePath(path)}`
}

export function getPlatformAppUrl(path = '') {
  return `${PLATFORM_APP_URL}${normalizePath(path)}`
}

export function getTenantSlugFromHost(host: string | null | undefined) {
  const normalized = normalizeHost(host)
  const platformSuffix = `.${PLATFORM_DOMAIN}`

  if (normalized.endsWith(platformSuffix)) {
    const subdomain = normalized.slice(0, -platformSuffix.length)
    if (!subdomain || subdomain.includes('.') || RESERVED_SUBDOMAINS.has(subdomain)) return null
    return subdomain
  }

  if (normalized.endsWith('.localhost')) {
    const subdomain = normalized.slice(0, -'.localhost'.length)
    if (!subdomain || subdomain.includes('.') || RESERVED_SUBDOMAINS.has(subdomain)) return null
    return subdomain
  }

  return null
}

export function getShopBasePath(tenantSlug: string, host: string | null | undefined) {
  return getTenantSlugFromHost(host) === tenantSlug || isLikelyCustomDomainHost(host) ? '' : `/sklep/${tenantSlug}`
}

export function getTenantShopUrl(tenantSlug: string, path = '') {
  return `https://${tenantSlug}.${PLATFORM_DOMAIN}${normalizePath(path)}`
}

export function getTenantPanelUrl(tenantSlug: string, path = 'dashboard') {
  return `https://${tenantSlug}.${PLATFORM_DOMAIN}${normalizePath(path)}`
}

export function getTenantPanelBasePath(tenantSlug: string, host: string | null | undefined) {
  return getTenantSlugFromHost(host) === tenantSlug || isLikelyCustomDomainHost(host) ? '' : `/${tenantSlug}`
}

export function shopPath(basePath: string, path = '') {
  const normalizedBase = basePath === '/' ? '' : basePath.replace(/\/$/, '')

  return `${normalizedBase}${normalizePath(path)}` || '/'
}
