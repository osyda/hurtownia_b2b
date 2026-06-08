const PLATFORM_DOMAIN = 'dostawio.pl'
const RESERVED_SUBDOMAINS = new Set(['app', 'www'])

export function normalizeHost(host: string | null | undefined) {
  return (host ?? '').split(':')[0]?.toLowerCase().replace(/\.$/, '') ?? ''
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
  const normalizedPath = path ? `/${path.replace(/^\//, '')}` : ''

  return `https://${tenantSlug}.${PLATFORM_DOMAIN}${normalizedPath}`
}

export function shopPath(basePath: string, path = '') {
  const normalizedBase = basePath === '/' ? '' : basePath.replace(/\/$/, '')
  const normalizedPath = path ? `/${path.replace(/^\//, '')}` : ''

  return `${normalizedBase}${normalizedPath}` || '/'
}
