'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatDateTime, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/utils'
import { updateTenantStatus } from '@/app/actions/admin'
import { ArrowLeft, Users, ShoppingCart, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface Tenant {
  id: string; name: string; slug: string; brand_color: string
  status: string; contact_email: string | null; contact_phone: string | null; created_at: string
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

  function handleStatusChange(status: 'active' | 'inactive' | 'suspended') {
    startTransition(async () => {
      const res = await updateTenantStatus(tenant.id, status)
      if (res?.error) toast.error(res.error)
      else { toast.success('Status zaktualizowany'); router.refresh() }
    })
  }

  const statusLabel = (s: string) =>
    s === 'active' ? 'Aktywna' : s === 'inactive' ? 'Nieaktywna' : 'Zawieszona'
  const statusColor = (s: string) =>
    s === 'active' ? 'bg-green-100 text-green-700' : s === 'inactive' ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-700'
  const roleLabel = (r: string) =>
    r === 'tenant_admin' ? 'Administrator' : r === 'tenant_employee' ? 'Pracownik' : r

  return (
    <div className="p-4 md:p-8">
      <Link href="/tenants" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="h-4 w-4" />
        Powrót do listy
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: tenant.brand_color }}
          >
            {tenant.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{tenant.name}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(tenant.status)}`}>
                {statusLabel(tenant.status)}
              </span>
            </div>
            <div className="text-sm text-gray-500 mt-0.5">
              slug: {tenant.slug}
              {tenant.contact_email && ` · ${tenant.contact_email}`}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/${tenant.slug}/dashboard`}
            target="_blank"
            className="flex items-center gap-2 text-sm text-blue-600 border border-blue-200 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Otwórz panel
          </Link>
          {tenant.status === 'active' ? (
            <button
              onClick={() => handleStatusChange('suspended')}
              disabled={isPending}
              className="text-sm text-red-600 border border-red-200 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
            >
              Zawieś
            </button>
          ) : (
            <button
              onClick={() => handleStatusChange('active')}
              disabled={isPending}
              className="text-sm text-green-600 border border-green-200 hover:bg-green-50 px-3 py-2 rounded-lg transition-colors"
            >
              Aktywuj
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Employees */}
        <div className="premium-card">
          <div className="p-4 border-b flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-400" />
            <h2 className="font-semibold text-sm text-gray-900">Pracownicy ({employees.length})</h2>
          </div>
          <div className="divide-y max-h-80 overflow-y-auto">
            {employees.length === 0 && (
              <div className="p-6 text-center text-gray-400 text-xs">Brak pracowników</div>
            )}
            {employees.map(e => (
              <div key={e.id} className="p-3">
                <div className="text-sm font-medium text-gray-900">{[e.first_name, e.last_name].filter(Boolean).join(' ') || '—'}</div>
                <div className="text-xs text-gray-400">{roleLabel(e.role)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Customers */}
        <div className="premium-card">
          <div className="p-4 border-b flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-400" />
            <h2 className="font-semibold text-sm text-gray-900">Klienci ({customers.length})</h2>
          </div>
          <div className="divide-y max-h-80 overflow-y-auto">
            {customers.length === 0 && (
              <div className="p-6 text-center text-gray-400 text-xs">Brak klientów</div>
            )}
            {customers.map(c => (
              <div key={c.id} className="p-3">
                <div className="text-sm font-medium text-gray-900">{c.company_name}</div>
                <div className="text-xs text-gray-400">
                  {c.email}
                  <span className={`ml-2 px-1.5 py-0.5 rounded-full font-medium ${
                    c.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {c.status === 'active' ? 'Aktywny' : 'Nieaktywny'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Orders */}
        <div className="premium-card">
          <div className="p-4 border-b flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-gray-400" />
            <h2 className="font-semibold text-sm text-gray-900">Ostatnie zamówienia</h2>
          </div>
          <div className="divide-y max-h-80 overflow-y-auto">
            {orders.length === 0 && (
              <div className="p-6 text-center text-gray-400 text-xs">Brak zamówień</div>
            )}
            {orders.map(o => (
              <div key={o.id} className="p-3 flex justify-between items-start">
                <div>
                  <div className="text-sm font-medium text-gray-900">{o.order_number}</div>
                  <div className="text-xs text-gray-400">{formatDateTime(o.created_at)}</div>
                </div>
                <div className="text-right">
                  <div className={`text-xs px-2 py-0.5 rounded-full font-medium ${ORDER_STATUS_COLORS[o.status]}`}>
                    {ORDER_STATUS_LABELS[o.status]}
                  </div>
                  <div className="text-xs font-medium text-gray-700 mt-1">{formatCurrency(o.total_gross)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
