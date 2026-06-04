import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import { ProductForm } from '@/components/tenant/product-form'
import { updateProduct } from '@/app/actions/products'

export default async function EditProductPage({ params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant: tenantSlug, id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('user_profiles').select('tenant_id').eq('id', user.id).single()
  if (!profile?.tenant_id) redirect('/login')

  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase.from('products').select('*').eq('id', id).eq('tenant_id', profile.tenant_id).single(),
    supabase.from('categories').select('*').eq('tenant_id', profile.tenant_id).eq('is_active', true).order('name'),
  ])

  if (!product) notFound()

  const submitAction = updateProduct.bind(null, tenantSlug, id)

  return (
    <div className="p-8 max-w-3xl">
      <PageHeader title="Edytuj produkt" description={product.name} />
      <ProductForm tenantSlug={tenantSlug} categories={categories ?? []} product={product} onSubmit={submitAction} />
    </div>
  )
}
