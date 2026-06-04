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
    <header className="bg-white border-b shadow-sm sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Nazwa */}
          <Link href={base} className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={tenantName} className="h-8 w-auto object-contain" />
            ) : (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ backgroundColor: brandColor }}
              >
                {tenantName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="font-bold text-gray-900 hidden sm:block">{tenantName}</span>
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
                    'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    active ? 'text-white' : 'text-gray-600 hover:bg-gray-100'
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
              className="relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: brandColor }}
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Koszyk</span>
              {itemCount() > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {itemCount()}
                </span>
              )}
            </Link>

            {/* Użytkownik */}
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <User className="h-4 w-4" />
              <span className="hidden sm:block max-w-[140px] truncate">{customerName}</span>
            </div>

            <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
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
                  'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                  active ? 'text-white' : 'text-gray-600 hover:bg-gray-100'
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
