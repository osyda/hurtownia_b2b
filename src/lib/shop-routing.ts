export const PLATFORM_DOMAIN = 'dostawio.pl'
export const PLATFORM_APP_SUBDOMAIN = 'app'
export const PLATFORM_APP_URL = `https://${PLATFORM_APP_SUBDOMAIN}.${PLATFORM_DOMAIN}`

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

export function isReservedTenantSlug(slug: string) {
  return RESERVED_SUBDOMAINS.has(slug.trim().toLowerCase())
}

export function isPlatformMarketingHost(host: string | null | undefined) {
  const normalized = normalizeHost(host)

  return normalized === PLATFORM_DOMAIN || normalized === `www.${PLATFORM_DOMAIN}`
}

export function getPlatformSiteUrl(path = '') {
  return `https://${PLATFORM_DOMAIN}${normalizePath(path)}`
}

export function getPlatformAppUrl(path = '') {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || PLATFORM_APP_URL).replace(/\/$/, '')

  return `${baseUrl}${normalizePath(path)}`
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
  return getTenantSlugFromHost(host) === tenantSlug ? '' : `/sklep/${tenantSlug}`
}

export function getTenantShopUrl(tenantSlug: string, path = '') {
  return `https://${tenantSlug}.${PLATFORM_DOMAIN}${normalizePath(path)}`
}

export function getTenantPanelUrl(tenantSlug: string, path = 'dashboard') {
  return getPlatformAppUrl(`/${tenantSlug}${normalizePath(path)}`)
}

export function shopPath(basePath: string, path = '') {
  const normalizedBase = basePath === '/' ? '' : basePath.replace(/\/$/, '')

  return `${normalizedBase}${normalizePath(path)}` || '/'
}
