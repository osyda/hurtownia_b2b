import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getTenantSlugFromHost, isPlatformMarketingHost } from '@/lib/shop-routing'
import { sharedAuthCookieOptions } from '@/lib/supabase/cookies'

function normalizeCookieExpires(expires: Date | number | undefined) {
  return typeof expires === 'number' ? new Date(expires) : expires
}

function copySupabaseCookies(from: NextResponse, to: NextResponse, host: string | null) {
  from.cookies.getAll().forEach(cookie => {
    to.cookies.set(
      cookie.name,
      cookie.value,
      sharedAuthCookieOptions(
        {
          domain: cookie.domain,
          expires: normalizeCookieExpires(cookie.expires),
          httpOnly: cookie.httpOnly,
          maxAge: cookie.maxAge,
          path: cookie.path,
          sameSite: cookie.sameSite,
          secure: cookie.secure,
        },
        host
      )
    )
  })

  return to
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(
              name,
              value,
              sharedAuthCookieOptions(options, request.headers.get('host'))
            )
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const host = request.headers.get('host')
  const tenantSlug = getTenantSlugFromHost(host)
  const isMarketingLanding = isPlatformMarketingHost(host) && pathname === '/'

  // Public routes that don't require auth
  const publicRoutes = ['/login', '/reset-password', '/invite']
  const isPublicRoute = publicRoutes.some(r => pathname.startsWith(r))

  if (!user && !isPublicRoute && !isMarketingLanding) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && tenantSlug && !isPublicRoute && !pathname.startsWith('/api')) {
    const shopPrefix = `/sklep/${tenantSlug}`

    if (pathname === shopPrefix || pathname.startsWith(`${shopPrefix}/`)) {
      const url = request.nextUrl.clone()
      url.pathname = pathname.slice(shopPrefix.length) || '/'
      return copySupabaseCookies(supabaseResponse, NextResponse.redirect(url), host)
    }

    if (pathname.startsWith('/sklep/')) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return copySupabaseCookies(supabaseResponse, NextResponse.redirect(url), host)
    }

    const url = request.nextUrl.clone()
    url.pathname = `${shopPrefix}${pathname === '/' ? '' : pathname}`
    return copySupabaseCookies(supabaseResponse, NextResponse.rewrite(url), host)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
