import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
  getPlatformSiteUrl,
  getTenantPanelUrl,
  getTenantShopUrl,
  getTenantSlugFromHost,
  isLegacyPlatformAppHost,
  isPlatformMarketingHost,
} from '@/lib/shop-routing'
import { isDostawioHost, sharedAuthCookieOptions } from '@/lib/supabase/cookies'

const TENANT_PANEL_SEGMENTS = new Set([
  'dashboard',
  'orders',
  'products',
  'categories',
  'customers',
  'prices',
  'import',
  'integrations',
  'settings',
])

const SHOP_SEGMENTS = new Set(['katalog', 'koszyk', 'zamowienia'])

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

function firstPathSegment(pathname: string) {
  return pathname.split('/').filter(Boolean)[0] ?? ''
}

function isTenantPanelPath(pathname: string, tenantSlug: string) {
  const segment = firstPathSegment(pathname)

  return segment === tenantSlug || TENANT_PANEL_SEGMENTS.has(segment)
}

function isShopPath(pathname: string) {
  const segment = firstPathSegment(pathname)

  return pathname === '/' || pathname === '/sklep' || pathname.startsWith('/sklep/') || SHOP_SEGMENTS.has(segment)
}

function tenantPanelDestination(tenantSlug: string, host: string | null) {
  return isDostawioHost(host) ? getTenantPanelUrl(tenantSlug, 'dashboard') : `/${tenantSlug}/dashboard`
}

function tenantShopDestination(tenantSlug: string, host: string | null) {
  return isDostawioHost(host) ? getTenantShopUrl(tenantSlug) : `/sklep/${tenantSlug}`
}

function redirectDestination(request: NextRequest, destination: string) {
  return destination.startsWith('/') ? new URL(destination, request.url) : destination
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const host = request.headers.get('host')

  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  if (isLegacyPlatformAppHost(host)) {
    const target = new URL(getPlatformSiteUrl(pathname === '/' ? '/login' : pathname))
    target.search = request.nextUrl.search

    return NextResponse.redirect(target)
  }

  const tenantSlug = getTenantSlugFromHost(host)
  const isMarketingLanding = isPlatformMarketingHost(host) && pathname === '/'
  const publicRoutes = ['/login', '/reset-password', '/invite']
  const isPublicRoute = publicRoutes.some(r => pathname.startsWith(r))

  if (isPublicRoute || isMarketingLanding) {
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

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return copySupabaseCookies(supabaseResponse, NextResponse.redirect(url), host)
  }

  if (user && tenantSlug) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, tenant_id')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return copySupabaseCookies(supabaseResponse, NextResponse.redirect(url), host)
    }

    if (profile.role === 'super_admin') {
      return copySupabaseCookies(
        supabaseResponse,
        NextResponse.redirect(getPlatformSiteUrl('/dashboard')),
        host
      )
    }

    if ((profile.role === 'tenant_admin' || profile.role === 'tenant_employee') && profile.tenant_id) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('slug')
        .eq('id', profile.tenant_id)
        .maybeSingle()

      if (!tenant?.slug) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return copySupabaseCookies(supabaseResponse, NextResponse.redirect(url), host)
      }

      if (tenant.slug !== tenantSlug) {
        return copySupabaseCookies(
          supabaseResponse,
          NextResponse.redirect(redirectDestination(request, tenantPanelDestination(tenant.slug, host))),
          host
        )
      }

      const tenantPanelPrefix = `/${tenantSlug}`

      if (pathname === tenantPanelPrefix || pathname.startsWith(`${tenantPanelPrefix}/`)) {
        const url = request.nextUrl.clone()
        url.pathname = pathname.slice(tenantPanelPrefix.length) || '/dashboard'
        return copySupabaseCookies(supabaseResponse, NextResponse.redirect(url), host)
      }

      if (isShopPath(pathname)) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return copySupabaseCookies(supabaseResponse, NextResponse.redirect(url), host)
      }

      const url = request.nextUrl.clone()
      url.pathname = `${tenantPanelPrefix}${pathname}`
      return copySupabaseCookies(supabaseResponse, NextResponse.rewrite(url), host)
    }

    if (profile.role !== 'customer') {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return copySupabaseCookies(supabaseResponse, NextResponse.redirect(url), host)
    }

    const { data: customer } = await supabase
      .from('customers')
      .select('tenants(slug)')
      .eq('user_id', user.id)
      .maybeSingle()

    const customerTenantSlug = (customer?.tenants as unknown as { slug: string } | null)?.slug

    if (!customerTenantSlug) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return copySupabaseCookies(supabaseResponse, NextResponse.redirect(url), host)
    }

    if (customerTenantSlug !== tenantSlug) {
      return copySupabaseCookies(
        supabaseResponse,
        NextResponse.redirect(redirectDestination(request, tenantShopDestination(customerTenantSlug, host))),
        host
      )
    }

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

    if (isTenantPanelPath(pathname, tenantSlug)) {
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
