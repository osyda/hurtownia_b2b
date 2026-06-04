import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { CategoryActions } from '@/components/tenant/category-actions'

export default async function CategoriesPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: tenantSlug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('user_profiles').select('tenant_id').eq('id', user.id).single()
  if (!profile?.tenant_id) redirect('/login')

  const { data: categories } = await supabase.from('categories')
    .select('*, parent:parent_id(name)')
    .eq('tenant_id', profile.tenant_id)
    .order('sort_order')
    .order('name')

  return (
    <div className="p-8">
      <PageHeader
        title="Kategorie"
        description="Zarządzaj kategoriami produktów"
        action={<CategoryActions tenantSlug={tenantSlug} categories={categories ?? []} />}
      />

      <div className="bg-white rounded-xl border overflow-hidden">
        {categories?.length ? (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Nazwa</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Nadrzędna</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Kolejność</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {categories.map(cat => {
                const parent = cat.parent as unknown as { name: string } | null
                return (
                  <tr key={cat.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-sm text-gray-900">{cat.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{parent?.name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{cat.sort_order}</td>
                    <td className="px-4 py-3">
                      <Badge variant={cat.is_active ? 'success' : 'gray'}>
                        {cat.is_active ? 'Aktywna' : 'Nieaktywna'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <CategoryActions tenantSlug={tenantSlug} categories={categories} editCategory={cat} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-16 text-center">
            <p className="text-gray-500 font-medium">Brak kategorii</p>
            <p className="text-gray-400 text-sm mt-1">Dodaj pierwszą kategorię klikając przycisk powyżej</p>
          </div>
        )}
      </div>
    </div>
  )
}
