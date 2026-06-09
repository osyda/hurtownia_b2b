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
  PlugZap,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { resolveBrandColor } from '@/lib/brand'

interface Props {
  tenantSlug: string
  tenantName: string
  brandColor: string
  role: string
  panelBasePath: string
}

export function TenantSidebar({ tenantSlug, tenantName, brandColor, role, panelBasePath }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const base = panelBasePath
  const resolvedBrandColor = resolveBrandColor(brandColor)
  const [open, setOpen] = useState(false)

  const navItems = [
    { href: `${base}/dashboard`, label: 'Dashboard', icon: LayoutDashboard },
    { href: `${base}/orders`, label: 'Zamówienia', icon: ShoppingCart },
    { href: `${base}/products`, label: 'Produkty', icon: Package },
    { href: `${base}/categories`, label: 'Kategorie', icon: FolderOpen },
    { href: `${base}/customers`, label: 'Klienci', icon: Users },
    { href: `${base}/prices`, label: 'Cenniki', icon: Tags },
    { href: `${base}/import`, label: 'Import', icon: Truck },
    { href: `${base}/integrations`, label: 'Integracje', icon: PlugZap },
    { href: `${base}/settings`, label: 'Ustawienia', icon: Settings },
  ]

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const SidebarContent = () => (
    <aside className="premium-sidebar flex h-full w-64 flex-col">
      <div className="flex items-center justify-between border-b border-white/10 p-5">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-black text-white shadow-lg shadow-[#27C7C3]/10 ring-1 ring-white/20"
            style={{ backgroundColor: resolvedBrandColor }}
          >
            {tenantName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="max-w-[150px] truncate text-sm font-bold leading-tight text-white">{tenantName}</div>
            <div className="mt-0.5 text-xs font-medium uppercase tracking-wide text-slate-400">
              {role === 'tenant_admin' ? 'Administrator' : 'Pracownik'}
            </div>
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="rounded-lg p-1 text-slate-400 transition hover:bg-white/10 md:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all',
              pathname.startsWith(item.href)
                ? 'text-white shadow-lg shadow-[#27C7C3]/10 ring-1 ring-white/15'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            )}
            style={pathname.startsWith(item.href) ? { backgroundColor: resolvedBrandColor } : {}}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
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
      <div className="premium-topbar fixed left-0 right-0 top-0 z-30 flex h-14 items-center justify-between px-4 md:hidden">
        <div className="flex items-center gap-3">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-white shadow-sm"
            style={{ backgroundColor: resolvedBrandColor }}
          >
            {tenantName.charAt(0).toUpperCase()}
          </div>
          <span className="max-w-[180px] truncate text-sm font-semibold text-slate-950">{tenantName}</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg p-2 transition hover:bg-slate-100"
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
