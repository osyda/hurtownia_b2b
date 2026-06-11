import { notFound } from 'next/navigation'
import { TenantDetail } from '@/components/admin/tenant-detail'
import { buildTenantOnboarding, externalizeOnboardingLinks } from '@/lib/onboarding'
import { getTenantPanelUrl } from '@/lib/shop-routing'
import { createClient } from '@/lib/supabase/server'

export default async function AdminTenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [
    tenantRes,
    employeesRes,
    customersRes,
    ordersRes,
    categoriesRes,
    productsRes,
    activeCustomersRes,
    paymentMethodsRes,
    priceGroupsRes,
    integrationsRes,
    allOrdersRes,
    deliverySettingsRes,
    assignedPaymentMethodsRes,
  ] = await Promise.all([
    supabase.from('tenants')
      .select('id, name, slug, brand_color, status, contact_email, contact_phone, custom_domain, custom_domain_status, custom_domain_verified_at, created_at')
      .eq('id', id)
      .single(),
    supabase.from('user_profiles')
      .select('id, first_name, last_name, role, created_at')
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
    supabase.from('categories').select('id', { count: 'exact', head: true })
      .eq('tenant_id', id).eq('is_active', true),
    supabase.from('products').select('id', { count: 'exact', head: true })
      .eq('tenant_id', id).eq('status', 'active'),
    supabase.from('customers').select('id', { count: 'exact', head: true })
      .eq('tenant_id', id).eq('status', 'active'),
    supabase.from('payment_methods').select('id', { count: 'exact', head: true })
      .eq('tenant_id', id).eq('is_active', true),
    supabase.from('price_groups').select('id', { count: 'exact', head: true })
      .eq('tenant_id', id),
    supabase.from('tenant_integrations').select('id', { count: 'exact', head: true })
      .eq('tenant_id', id).eq('is_active', true),
    supabase.from('orders').select('id', { count: 'exact', head: true })
      .eq('tenant_id', id),
    supabase.from('delivery_settings').select('id').eq('tenant_id', id).maybeSingle(),
    supabase.from('customer_payment_methods')
      .select('customer_id, customers!inner(tenant_id)', { count: 'exact', head: true })
      .eq('customers.tenant_id', id),
  ])

  if (!tenantRes.data) notFound()

  const onboarding = externalizeOnboardingLinks(
    buildTenantOnboarding({
      tenant: tenantRes.data,
      counts: {
        categories: categoriesRes.count ?? 0,
        products: productsRes.count ?? 0,
        customers: activeCustomersRes.count ?? 0,
        paymentMethods: paymentMethodsRes.count ?? 0,
        priceGroups: priceGroupsRes.count ?? 0,
        integrations: integrationsRes.count ?? 0,
        orders: allOrdersRes.count ?? 0,
        customerPaymentAssignments: assignedPaymentMethodsRes.count ?? 0,
      },
      hasDeliverySettings: Boolean(deliverySettingsRes.data),
    }, tenantRes.data.slug),
    getTenantPanelUrl(tenantRes.data.slug, '')
  )

  return (
    <TenantDetail
      tenant={tenantRes.data}
      employees={employeesRes.data ?? []}
      customers={customersRes.data ?? []}
      orders={ordersRes.data ?? []}
      onboarding={onboarding}
    />
  )
}
