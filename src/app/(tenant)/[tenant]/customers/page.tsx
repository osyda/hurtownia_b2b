import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search, Building2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'

export default async function CustomersPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  const { tenant: tenantSlug } = await params
  const { q, status } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('user_profiles').select('tenant_id').eq('id', user.id).single()
  if (!profile?.tenant_id) redirect('/login')

  let query = supabase.from('customers')
    .select('id, company_name, nip, email, phone, status, price_groups(name)')
    .eq('tenant_id', profile.tenant_id)
    .order('company_name')

  if (q) query = query.ilike('company_name', `%${q}%`)
  if (status) query = query.eq('status', status)

  const { data: customers } = await query

  const statusLabels: Record<string, string> = { active: 'Aktywny', inactive: 'Nieaktywny', pending: 'Oczekujący' }
  const statusVariants: Record<string, 'success' | 'error' | 'warning'> = { active: 'success', inactive: 'error', pending: 'warning' }

  return (
    <div className="p-8">
      <PageHeader
        title="Klienci"
        description={`${customers?.length ?? 0} klientów`}
        action={
          <Link href={`/${tenantSlug}/customers/new`} className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            <Plus className="h-4 w-4" /> Dodaj klienta
          </Link>
        }
      />

      <form className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input name="q" defaultValue={q} placeholder="Szukaj klienta..." className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select name="status" defaultValue={status} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Wszystkie statusy</option>
          <option value="active">Aktywni</option>
          <option value="pending">Oczekujący</option>
          <option value="inactive">Nieaktywni</option>
        </select>
        <button type="submit" className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors">Filtruj</button>
      </form>

      <div className="bg-white rounded-xl border overflow-hidden">
        {customers?.length ? (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Firma</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">NIP</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">E-mail</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Telefon</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Grupa cenowa</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {customers.map(c => {
                const pg = c.price_groups as unknown as { name: string } | null
                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Building2 className="h-4 w-4 text-gray-400" />
                        </div>
                        <span className="font-medium text-sm text-gray-900">{c.company_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{c.nip || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{c.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{c.phone || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{pg?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariants[c.status]}>{statusLabels[c.status]}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/${tenantSlug}/customers/${c.id}`} className="text-sm text-blue-600 hover:underline">Edytuj</Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-16 text-center">
            <Building2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Brak klientów</p>
            <p className="text-gray-400 text-sm mt-1">Dodaj pierwszego klienta klikając przycisk powyżej</p>
          </div>
        )}
      </div>
    </div>
  )
}
