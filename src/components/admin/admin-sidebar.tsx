'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Building2,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tenants', label: 'Hurtownie', icon: Building2 },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const SidebarContent = () => (
    <aside className="premium-sidebar flex h-full w-64 flex-col">
      <div className="flex items-center justify-between border-b border-slate-200/80 p-6">
        <div>
          <div className="text-lg font-bold tracking-tight text-slate-950">B2B Connect</div>
          <div className="mt-0.5 text-xs font-medium uppercase tracking-wide text-slate-400">Super Admin</div>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="rounded-lg p-1 text-slate-500 transition hover:bg-slate-100 md:hidden"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all',
              pathname.startsWith(item.href)
                ? 'bg-slate-950 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-slate-200/80 p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
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
        <div className="font-bold text-slate-950">B2B Connect</div>
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
