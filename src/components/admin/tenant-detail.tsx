'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ExternalLink, Globe2, ShoppingCart, Store, Users } from 'lucide-react'
import { toast } from 'sonner'
import { updateTenantStatus } from '@/app/actions/admin'
import { getTenantPanelUrl, getTenantShopUrl } from '@/lib/shop-routing'
import { formatCurrency, formatDateTime, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '@/lib/utils'

interface Tenant {
  id: string
  name: string
  slug: string
  brand_color: string
  status: string
  contact_email: string | null
  contact_phone: string | null
  created_at: string
}

export function TenantDetail({
  tenant,
  employees,
  customers,
  orders,
}: {
  tenant: Tenant
  employees: { id: string; first_name: string | null; last_name: string | null; role: string; created_at: string }[]
  customers: { id: string; company_name: string; email: string | null; status: string; created_at: string }[]
  orders: { id: string; order_number: string; status: string; total_gross: number; created_at: string }[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const shopUrl = getTenantShopUrl(tenant.slug)
  const panelUrl = getTenantPanelUrl(tenant.slug)

  function handleStatusChange(status: 'active' | 'inactive' | 'suspended') {
    startTransition(async () => {
      const res = await updateTenantStatus(tenant.id, status)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success('Status zaktualizowany')
        router.refresh()
      }
    })
  }

  const statusLabel = (status: string) =>
    status === 'active' ? 'Aktywna' : status === 'inactive' ? 'Nieaktywna' : 'Zawieszona'

  const statusColor = (status: string) =>
    status === 'active'
      ? 'bg-emerald-100 text-emerald-700'
      : status === 'inactive'
        ? 'bg-slate-100 text-slate-600'
        : 'bg-red-100 text-red-700'

  const roleLabel = (role: string) =>
    role === 'tenant_admin' ? 'Administrator' : role === 'tenant_employee' ? 'Pracownik' : role

  return (
    <div className="space-y-6 p-4 md:p-8">
      <Link href="/tenants" className="flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" />
        Powrót do listy
      </Link>

      <section className="premium-card p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-lg text-lg font-black text-white"
              style={{ backgroundColor: tenant.brand_color }}
            >
              {tenant.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-slate-950">{tenant.name}</h1>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${statusColor(tenant.status)}`}>
                  {statusLabel(tenant.status)}
                </span>
              </div>
              <div className="mt-1 text-sm text-slate-500">
                slug: <span className="font-mono font-bold text-slate-700">{tenant.slug}</span>
                {tenant.contact_email && ` · ${tenant.contact_email}`}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={panelUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <Globe2 className="h-4 w-4" />
              Panel
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <a
              href={shopUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-sky-200 px-3 py-2 text-sm font-bold text-sky-700 transition hover:bg-sky-50"
            >
              <Store className="h-4 w-4" />
              Sklep
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            {tenant.status === 'active' ? (
              <button
                onClick={() => handleStatusChange('suspended')}
                disabled={isPending}
                className="rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                Zawieś
              </button>
            ) : (
              <button
                onClick={() => handleStatusChange('active')}
                disabled={isPending}
                className="rounded-lg border border-emerald-200 px-3 py-2 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
              >
                Aktywuj
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <AddressCard label="Sklep klienta" value={shopUrl} />
          <AddressCard label="Panel hurtowni" value={panelUrl} />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <section className="premium-card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-200/80 p-4">
            <Users className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-black text-slate-950">Pracownicy ({employees.length})</h2>
          </div>
          <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
            {employees.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-400">Brak pracowników</div>
            )}
            {employees.map(employee => (
              <div key={employee.id} className="p-3">
                <div className="text-sm font-bold text-slate-900">
                  {[employee.first_name, employee.last_name].filter(Boolean).join(' ') || '-'}
                </div>
                <div className="text-xs text-slate-400">{roleLabel(employee.role)}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="premium-card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-200/80 p-4">
            <Users className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-black text-slate-950">Klienci ({customers.length})</h2>
          </div>
          <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
            {customers.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-400">Brak klientów</div>
            )}
            {customers.map(customer => (
              <div key={customer.id} className="p-3">
                <div className="text-sm font-bold text-slate-900">{customer.company_name}</div>
                <div className="text-xs text-slate-400">
                  {customer.email}
                  <span className={`ml-2 rounded-full px-1.5 py-0.5 font-bold ${
                    customer.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {customer.status === 'active' ? 'Aktywny' : 'Nieaktywny'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="premium-card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-200/80 p-4">
            <ShoppingCart className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-black text-slate-950">Ostatnie zamówienia</h2>
          </div>
          <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
            {orders.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-400">Brak zamówień</div>
            )}
            {orders.map(order => (
              <div key={order.id} className="flex items-start justify-between gap-3 p-3">
                <div>
                  <div className="text-sm font-bold text-slate-900">{order.order_number}</div>
                  <div className="text-xs text-slate-400">{formatDateTime(order.created_at)}</div>
                </div>
                <div className="text-right">
                  <div className={`rounded-full px-2 py-0.5 text-xs font-bold ${ORDER_STATUS_COLORS[order.status]}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </div>
                  <div className="mt-1 text-xs font-bold text-slate-700">{formatCurrency(order.total_gross)}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function AddressCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{label}</div>
      <div className="mt-2 break-all font-mono text-sm font-bold text-sky-700">{value}</div>
    </div>
  )
}
