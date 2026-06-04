import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import { CustomerForm } from '@/components/tenant/customer-form'
import { updateCustomer } from '@/app/actions/customers'

export default async function EditCustomerPage({ params }: { params: Promise<{ tenant: string; id: string }> }) {
  const { tenant: tenantSlug, id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('user_profiles').select('tenant_id').eq('id', user.id).single()
  if (!profile?.tenant_id) redirect('/login')

  const [{ data: customer }, { data: priceGroups }] = await Promise.all([
    supabase.from('customers').select('*').eq('id', id).eq('tenant_id', profile.tenant_id).single(),
    supabase.from('price_groups').select('*').eq('tenant_id', profile.tenant_id).order('name'),
  ])

  if (!customer) notFound()

  const submitAction = updateCustomer.bind(null, tenantSlug, id)

  return (
    <div className="p-8 max-w-3xl">
      <PageHeader title="Edytuj klienta" description={customer.company_name} />
      <CustomerForm tenantSlug={tenantSlug} priceGroups={priceGroups ?? []} customer={customer} onSubmit={submitAction} />
    </div>
  )
}
