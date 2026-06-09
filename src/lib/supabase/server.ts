import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'
import { sharedAuthCookieOptions } from '@/lib/supabase/cookies'

export async function createClient() {
  const cookieStore = await cookies()
  const headersList = await headers()
  const host = headersList.get('host')

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, sharedAuthCookieOptions(options, host))
            )
          } catch {
            // Server component — cookies set in middleware
          }
        },
      },
    }
  )
}

export async function createAdminClient() {
  const cookieStore = await cookies()
  const headersList = await headers()
  const host = headersList.get('host')

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, sharedAuthCookieOptions(options, host))
            )
          } catch {}
        },
      },
    }
  )
}
