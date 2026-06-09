import type { CookieOptions } from '@supabase/ssr'
import { normalizeHost, PLATFORM_DOMAIN } from '@/lib/shop-routing'

export function isDostawioHost(host: string | null | undefined) {
  const normalized = normalizeHost(host)

  return normalized === PLATFORM_DOMAIN || normalized.endsWith(`.${PLATFORM_DOMAIN}`)
}

export function sharedAuthCookieOptions(
  options: CookieOptions,
  host: string | null | undefined
): CookieOptions {
  if (!isDostawioHost(host)) return options

  return {
    ...options,
    domain: `.${PLATFORM_DOMAIN}`,
    path: '/',
    sameSite: 'lax',
    secure: true,
  }
}
