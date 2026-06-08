'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ClipboardList, LogOut, Package, ShoppingCart, User } from 'lucide-react'
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
  const count = itemCount()

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
    { href: base, label: 'Start', icon: Package, exact: true },
    { href: `${base}/katalog`, label: 'Produkty', icon: Package },
    { href: `${base}/zamowienia`, label: 'Zamowienia', icon: ClipboardList },
  ]

  return (
    <header className="premium-topbar sticky top-0 z-40">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href={base} className="flex min-w-0 items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={tenantName} className="h-9 w-auto max-w-[140px] object-contain" />
            ) : (
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-sm font-black text-white shadow-lg shadow-slate-900/10"
                style={{ backgroundColor: brandColor }}
              >
                {tenantName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="hidden min-w-0 sm:block">
              <div className="truncate text-sm font-black tracking-tight text-slate-950">{tenantName}</div>
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">B2B Store</div>
            </div>
          </Link>

          <nav className="hidden items-center rounded-lg border border-slate-200/80 bg-white p-1 shadow-sm md:flex">
            {navItems.map(item => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-bold transition-all',
                    active ? 'text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                  )}
                  style={active ? { backgroundColor: brandColor } : {}}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href={`${base}/koszyk`}
              className="relative flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-sm font-black text-white shadow-lg shadow-slate-900/10 transition-all hover:-translate-y-0.5 hover:bg-slate-800"
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Koszyk</span>
              {count > 0 && (
                <span
                  className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-black text-white ring-2 ring-white"
                  style={{ backgroundColor: brandColor }}
                >
                  {count}
                </span>
              )}
            </Link>

            <div className="hidden items-center gap-2 rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-sm font-semibold text-slate-600 lg:flex">
              <User className="h-4 w-4 text-slate-400" />
              <span className="max-w-[150px] truncate">{customerName}</span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-slate-200/80 bg-white p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Wyloguj"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        <nav className="flex gap-2 overflow-x-auto pb-3 md:hidden">
          {navItems.map(item => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold transition-all',
                  active ? 'text-white shadow-sm' : 'border border-slate-200/80 bg-white text-slate-600'
                )}
                style={active ? { backgroundColor: brandColor } : {}}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
