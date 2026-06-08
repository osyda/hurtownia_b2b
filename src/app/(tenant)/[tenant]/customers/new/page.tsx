import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import { CustomerForm } from '@/components/tenant/customer-form'
import { createCustomer } from '@/app/actions/customers'

export default async function NewCustomerPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: tenantSlug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('user_profiles').select('tenant_id').eq('id', user.id).single()
  if (!profile?.tenant_id) redirect('/login')

  const [{ data: priceGroups }, { data: paymentMethods }] = await Promise.all([
    supabase.from('price_groups').select('*').eq('tenant_id', profile.tenant_id).order('name'),
    supabase.from('payment_methods').select('*').eq('tenant_id', profile.tenant_id).order('sort_order').order('created_at'),
  ])

  const submitAction = createCustomer.bind(null, tenantSlug)

  return (
    <div className="p-8 max-w-3xl">
      <PageHeader title="Nowy klient" description="Dodaj klienta do swojej hurtowni" />
      <CustomerForm
        tenantSlug={tenantSlug}
        priceGroups={priceGroups ?? []}
        paymentMethods={paymentMethods ?? []}
        onSubmit={submitAction}
      />
    </div>
  )
}
