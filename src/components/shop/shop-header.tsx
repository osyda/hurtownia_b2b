'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ShoppingCart, Package, ClipboardList, LogOut, User } from 'lucide-react'
import { useCart } from '@/lib/cart-store'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'

interface Props {
  tenantSlug: string
  tenantName: string
  brandColor: string
  logoUrl: string | null
  customerName: string
}

export function ShopHeader({ tenantSlug, tenantName, brandColor, logoUrl, customerName }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const { itemCount, setTenant } = useCart()

  useEffect(() => {
    setTenant(tenantSlug)
  }, [tenantSlug, setTenant])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const base = `/sklep/${tenantSlug}`
  const navItems = [
    { href: base, label: 'Strona główna', icon: Package, exact: true },
    { href: `${base}/katalog`, label: 'Produkty', icon: Package },
    { href: `${base}/zamowienia`, label: 'Moje zamówienia', icon: ClipboardList },
  ]

  return (
    <header className="premium-topbar sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Nazwa */}
          <Link href={base} className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={tenantName} className="h-8 w-auto object-contain" />
            ) : (
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white shadow-sm"
                style={{ backgroundColor: brandColor }}
              >
                {tenantName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="hidden font-bold tracking-tight text-slate-950 sm:block">{tenantName}</span>
          </Link>

          {/* Nawigacja */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm font-semibold transition-all',
                    active ? 'text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                  )}
                  style={active ? { backgroundColor: brandColor } : {}}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Prawa strona */}
          <div className="flex items-center gap-3">
            {/* Koszyk */}
            <Link
              href={`${base}/koszyk`}
              className="relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90"
              style={{ backgroundColor: brandColor }}
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Koszyk</span>
              {itemCount() > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white ring-2 ring-white">
                  {itemCount()}
                </span>
              )}
            </Link>

            {/* Użytkownik */}
            <div className="flex items-center gap-1 text-sm text-slate-500">
              <User className="h-4 w-4" />
              <span className="hidden sm:block max-w-[140px] truncate">{customerName}</span>
            </div>

            <button onClick={handleLogout} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="flex md:hidden gap-1 pb-2 overflow-x-auto">
          {navItems.map(item => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold transition-all',
                  active ? 'text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                )}
                style={active ? { backgroundColor: brandColor } : {}}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
