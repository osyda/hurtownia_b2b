import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Search, Package } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>
  searchParams: Promise<{ q?: string; category?: string; status?: string }>
}) {
  const { tenant: tenantSlug } = await params
  const { q, category, status } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('user_profiles').select('tenant_id').eq('id', user.id).single()
  if (!profile?.tenant_id) redirect('/login')

  let query = supabase.from('products')
    .select('id, name, sku, unit, base_price, vat_rate, status, stock_status, categories(name)')
    .eq('tenant_id', profile.tenant_id)
    .order('name')

  if (q) query = query.ilike('name', `%${q}%`)
  if (category) query = query.eq('category_id', category)
  if (status) query = query.eq('status', status)

  const { data: products } = await query
  const { data: categories } = await supabase.from('categories')
    .select('id, name').eq('tenant_id', profile.tenant_id).eq('is_active', true).order('name')

  return (
    <div className="p-8">
      <PageHeader
        title="Produkty"
        description={`${products?.length ?? 0} produktów`}
        action={
          <Link href={`/${tenantSlug}/products/new`} className="inline-flex items-center gap-2 bg-[#1D2125] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#16191C] transition-colors">
            <Plus className="h-4 w-4" /> Dodaj produkt
          </Link>
        }
      />

      {/* Filtry */}
      <form className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Szukaj produktu..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/15"
          />
        </div>
        <select name="category" defaultValue={category} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/15">
          <option value="">Wszystkie kategorie</option>
          {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select name="status" defaultValue={status} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/15">
          <option value="">Wszystkie statusy</option>
          <option value="active">Aktywne</option>
          <option value="inactive">Nieaktywne</option>
        </select>
        <button type="submit" className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          Filtruj
        </button>
      </form>

      {/* Tabela */}
      <div className="premium-card overflow-hidden">
        {products?.length ? (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Produkt</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">SKU</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Kategoria</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Jednostka</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Cena netto</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">VAT</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Stan</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map(product => {
                const cat = product.categories as unknown as { name: string } | null
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package className="h-4 w-4 text-gray-400" />
                        </div>
                        <span className="font-medium text-sm text-gray-900">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{product.sku || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{cat?.name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{product.unit}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">{formatCurrency(product.base_price)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{product.vat_rate}%</td>
                    <td className="px-4 py-3">
                      <Badge variant={product.stock_status === 'available' ? 'success' : product.stock_status === 'limited' ? 'warning' : 'error'}>
                        {product.stock_status === 'available' ? 'Dostępny' : product.stock_status === 'limited' ? 'Ograniczony' : 'Niedostępny'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={product.status === 'active' ? 'success' : 'gray'}>
                        {product.status === 'active' ? 'Aktywny' : 'Nieaktywny'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/${tenantSlug}/products/${product.id}`} className="text-sm text-[#1D2125] hover:underline">
                        Edytuj
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-16 text-center">
            <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Brak produktów</p>
            <p className="text-gray-400 text-sm mt-1">Dodaj pierwszy produkt klikając przycisk powyżej</p>
          </div>
        )}
      </div>
    </div>
  )
}
