'use client'

import { useState } from 'react'
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
  Menu,
  X,
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
  const [open, setOpen] = useState(false)

  const navItems = [
    { href: `${base}/dashboard`, label: 'Dashboard', icon: LayoutDashboard },
    { href: `${base}/orders`, label: 'Zamówienia', icon: ShoppingCart },
    { href: `${base}/products`, label: 'Produkty', icon: Package },
    { href: `${base}/categories`, label: 'Kategorie', icon: FolderOpen },
    { href: `${base}/customers`, label: 'Klienci', icon: Users },
    { href: `${base}/prices`, label: 'Cenniki', icon: Tags },
    { href: `${base}/import`, label: 'Import', icon: Truck },
    { href: `${base}/settings`, label: 'Ustawienia', icon: Settings },
  ]

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const SidebarContent = () => (
    <aside className="w-64 bg-white border-r flex flex-col h-full">
      <div className="p-5 border-b flex items-center justify-between" style={{ borderBottomColor: brandColor + '30' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
            style={{ backgroundColor: brandColor }}
          >
            {tenantName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-sm text-gray-900 leading-tight">{tenantName}</div>
            <div className="text-xs text-gray-400 mt-0.5">
              {role === 'tenant_admin' ? 'Administrator' : 'Pracownik'}
            </div>
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="md:hidden p-1 rounded-lg hover:bg-gray-100"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname.startsWith(item.href)
                ? 'text-white'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
            style={pathname.startsWith(item.href) ? { backgroundColor: brandColor } : {}}
          >
            <item.icon className="h-4 w-4 shrink-0" />
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

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: brandColor }}
          >
            {tenantName.charAt(0).toUpperCase()}
          </div>
          <span className="font-semibold text-sm text-gray-900 truncate max-w-[180px]">{tenantName}</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <Menu className="h-5 w-5 text-gray-700" />
        </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div className={cn(
        'md:hidden fixed inset-y-0 left-0 z-50 transform transition-transform duration-200',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <SidebarContent />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <SidebarContent />
      </div>
    </>
  )
}
