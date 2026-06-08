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

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) redirect('/login')

  const { data: categories } = await supabase.from('categories')
    .select('*, parent:parent_id(name)')
    .eq('tenant_id', profile.tenant_id)
    .order('sort_order')
    .order('name')

  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title="Kategorie"
        description="Zarządzaj kategoriami produktów"
        action={<CategoryActions tenantSlug={tenantSlug} categories={categories ?? []} />}
      />

      <div className="premium-card overflow-hidden">
        {categories?.length ? (
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">Nazwa</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">Nadrzędna</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">Kolejność</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {categories.map(cat => {
                const parent = cat.parent as unknown as { name: string } | null
                return (
                  <tr key={cat.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-bold text-gray-900">{cat.name}</td>
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
            <p className="font-bold text-gray-500">Brak kategorii</p>
            <p className="mt-1 text-sm text-gray-400">Dodaj pierwszą kategorię klikając przycisk powyżej.</p>
          </div>
        )}
      </div>
    </div>
  )
}
