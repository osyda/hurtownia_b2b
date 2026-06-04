import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import { ProductForm } from '@/components/tenant/product-form'
import { createProduct } from '@/app/actions/products'

export default async function NewProductPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: tenantSlug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('user_profiles').select('tenant_id').eq('id', user.id).single()
  if (!profile?.tenant_id) redirect('/login')

  const { data: categories } = await supabase.from('categories')
    .select('*').eq('tenant_id', profile.tenant_id).eq('is_active', true).order('name')

  const submitAction = createProduct.bind(null, tenantSlug)

  return (
    <div className="p-8 max-w-3xl">
      <PageHeader title="Nowy produkt" description="Dodaj produkt do katalogu hurtowni" />
      <ProductForm tenantSlug={tenantSlug} categories={categories ?? []} onSubmit={submitAction} />
    </div>
  )
}
