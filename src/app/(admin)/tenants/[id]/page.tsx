import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { TenantDetail } from '@/components/admin/tenant-detail'

export default async function AdminTenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [tenantRes, employeesRes, customersRes, ordersRes] = await Promise.all([
    supabase.from('tenants')
      .select('id, name, slug, brand_color, status, contact_email, contact_phone, created_at')
      .eq('id', id)
      .single(),
    supabase.from('user_profiles')
      .select('id, full_name, email, role, created_at')
      .eq('tenant_id', id)
      .order('created_at'),
    supabase.from('customers')
      .select('id, company_name, email, status, created_at')
      .eq('tenant_id', id)
      .order('company_name')
      .limit(20),
    supabase.from('orders')
      .select('id, order_number, status, total_gross, created_at')
      .eq('tenant_id', id)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  if (!tenantRes.data) notFound()

  return (
    <TenantDetail
      tenant={tenantRes.data}
      employees={employeesRes.data ?? []}
      customers={customersRes.data ?? []}
      orders={ordersRes.data ?? []}
    />
  )
}
