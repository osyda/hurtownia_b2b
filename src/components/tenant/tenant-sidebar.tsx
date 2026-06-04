'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  Users,
  ShoppingCart,
  Tags,
  Truck,
  Settings,
  LogOut,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  tenantSlug: string
  tenantName: string
  brandColor: string
  role: string
}

export function TenantSidebar({ tenantSlug, tenantName, brandColor, role }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const base = `/${tenantSlug}`

  const navItems = [
    { href: `${base}/dashboard`, label: 'Dashboard', icon: LayoutDashboard },
    { href: `${base}/orders`, label: 'Zamówienia', icon: ShoppingCart },
    { href: `${base}/products`, label: 'Produkty', icon: Package },
    { href: `${base}/categories`, label: 'Kategorie', icon: FolderOpen },
    { href: `${base}/customers`, label: 'Klienci', icon: Users },
    { href: `${base}/prices`, label: 'Cenniki', icon: Tags },
    { href: `${base}/settings`, label: 'Ustawienia', icon: Settings },
  ]

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-64 bg-white border-r flex flex-col">
      <div className="p-6 border-b" style={{ borderBottomColor: brandColor + '30' }}>
        <div
          className="w-8 h-8 rounded-lg mb-3 flex items-center justify-center text-white text-sm font-bold"
          style={{ backgroundColor: brandColor }}
        >
          {tenantName.charAt(0).toUpperCase()}
        </div>
        <div className="font-bold text-sm text-gray-900 leading-tight">{tenantName}</div>
        <div className="text-xs text-gray-400 mt-0.5">
          {role === 'tenant_admin' ? 'Administrator' : 'Pracownik'}
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname.startsWith(item.href)
                ? 'text-white'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
            style={pathname.startsWith(item.href) ? { backgroundColor: brandColor } : {}}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Wyloguj
        </button>
      </div>
    </aside>
  )
}
