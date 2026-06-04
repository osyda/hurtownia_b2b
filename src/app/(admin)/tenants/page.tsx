import { createClient } from '@/lib/supabase/server'
import { Building2, Plus } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import Link from 'next/link'

export default async function AdminTenantsPage() {
  const supabase = await createClient()

  const { data: tenants } = await supabase
    .from('tenants')
    .select(`
      id, name, slug, brand_color, status, contact_email, created_at,
      user_profiles(count),
      customers(count)
    `)
    .order('created_at', { ascending: false })

  const statusLabel = (s: string) =>
    s === 'active' ? 'Aktywna' : s === 'inactive' ? 'Nieaktywna' : 'Zawieszona'
  const statusColor = (s: string) =>
    s === 'active' ? 'bg-green-100 text-green-700' : s === 'inactive' ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-700'

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hurtownie</h1>
          <p className="text-sm text-gray-500 mt-1">{tenants?.length ?? 0} hurtowni w systemie</p>
        </div>
        <Link
          href="/admin/tenants/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nowa hurtownia
        </Link>
      </div>

      <div className="bg-white rounded-xl border">
        <div className="divide-y">
          {!tenants?.length && (
            <div className="p-12 text-center text-gray-400">
              <Building2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <div className="text-sm">Brak hurtowni — dodaj pierwszą</div>
            </div>
          )}
          {tenants?.map(t => {
            const employees = (t.user_profiles as unknown as { count: number }[])?.[0]?.count ?? 0
            const customers = (t.customers as unknown as { count: number }[])?.[0]?.count ?? 0
            return (
              <Link
                key={t.id}
                href={`/admin/tenants/${t.id}`}
                className="flex items-center p-5 hover:bg-gray-50 transition-colors"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base mr-4 shrink-0"
                  style={{ backgroundColor: t.brand_color || '#2563eb' }}
                >
                  {t.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{t.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(t.status)}`}>
                      {statusLabel(t.status)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    slug: {t.slug}
                    {t.contact_email && ` · ${t.contact_email}`}
                  </div>
                </div>
                <div className="text-right text-xs text-gray-500 ml-4 shrink-0">
                  <div>{employees} pracowników · {customers} klientów</div>
                  <div className="text-gray-400 mt-0.5">dodana {formatDateTime(t.created_at)}</div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
