import { createBrowserClient } from '@supabase/ssr'
import { isDostawioHost } from '@/lib/supabase/cookies'
import { PLATFORM_DOMAIN } from '@/lib/shop-routing'

export function createClient() {
  const host = typeof window === 'undefined' ? null : window.location.host
  const cookieOptions = isDostawioHost(host)
    ? {
        domain: `.${PLATFORM_DOMAIN}`,
        path: '/',
        sameSite: 'lax' as const,
        secure: true,
      }
    : undefined

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookieOptions }
  )
}
