import Link from 'next/link'
import { Building2, Plus, Store } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getTenantShopUrl } from '@/lib/shop-routing'
import { buildTenantOnboarding } from '@/lib/onboarding'
import { formatDateTime } from '@/lib/utils'

function relationCount(value: unknown) {
  return (value as { count: number }[] | null)?.[0]?.count ?? 0
}

export default async function AdminTenantsPage() {
  const supabase = await createClient()

  const { data: tenants } = await supabase
    .from('tenants')
    .select(`
      id, name, slug, brand_color, status, contact_email, contact_phone, created_at,
      user_profiles(count),
      customers(count),
      categories(count),
      products(count),
      payment_methods(count),
      price_groups(count),
      tenant_integrations(count),
      orders(count),
      delivery_settings(count)
    `)
    .order('created_at', { ascending: false })

  const statusLabel = (status: string) =>
    status === 'active' ? 'Aktywna' : status === 'inactive' ? 'Nieaktywna' : 'Zawieszona'

  const statusColor = (status: string) =>
    status === 'active'
      ? 'bg-emerald-100 text-emerald-700'
      : status === 'inactive'
        ? 'bg-slate-100 text-slate-600'
        : 'bg-red-100 text-red-700'

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950">Hurtownie</h1>
          <p className="mt-1 text-sm text-slate-500">{tenants?.length ?? 0} hurtowni w systemie Dostawio</p>
        </div>
        <Link
          href="/tenants/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#303030] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#083B2B]"
        >
          <Plus className="h-4 w-4" />
          Nowa hurtownia
        </Link>
      </div>

      <div className="premium-card overflow-hidden">
        <div className="divide-y divide-slate-100">
          {!tenants?.length && (
            <div className="p-12 text-center text-slate-400">
              <Building2 className="mx-auto mb-2 h-8 w-8 opacity-40" />
              <div className="text-sm">Brak hurtowni. Dodaj pierwszą, żeby uruchomić sklep na subdomenie.</div>
            </div>
          )}

          {tenants?.map(tenant => {
            const employees = relationCount(tenant.user_profiles)
            const customers = relationCount(tenant.customers)
            const shopUrl = getTenantShopUrl(tenant.slug)
            const onboarding = buildTenantOnboarding({
              tenant,
              counts: {
                categories: relationCount(tenant.categories),
                products: relationCount(tenant.products),
                customers,
                paymentMethods: relationCount(tenant.payment_methods),
                priceGroups: relationCount(tenant.price_groups),
                integrations: relationCount(tenant.tenant_integrations),
                orders: relationCount(tenant.orders),
              },
              hasDeliverySettings: relationCount(tenant.delivery_settings) > 0,
            }, tenant.slug)

            return (
              <Link
                key={tenant.id}
                href={`/tenants/${tenant.id}`}
                className="grid gap-4 p-5 transition hover:bg-slate-50 lg:grid-cols-[auto_1fr_220px_auto] lg:items-center"
              >
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-lg text-base font-black text-white"
                  style={{ backgroundColor: tenant.brand_color || '#0F4D38' }}
                >
                  {tenant.name.charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-black text-slate-950">{tenant.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${statusColor(tenant.status)}`}>
                      {statusLabel(tenant.status)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                      {onboarding.label}
                    </span>
                  </div>
                  <div className="mt-1 flex min-w-0 items-center gap-2 text-xs text-slate-500">
                    <Store className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate font-mono font-semibold text-[#0F4D38]">{shopUrl}</span>
                  </div>
                  {tenant.contact_email && (
                    <div className="mt-1 truncate text-xs text-slate-400">{tenant.contact_email}</div>
                  )}
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Gotowość</span>
                    <span className="text-sm font-black text-slate-950">{onboarding.score}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-[#303030]" style={{ width: `${onboarding.score}%` }} />
                  </div>
                </div>

                <div className="text-left text-xs text-slate-500 lg:text-right">
                  <div className="font-semibold">{employees} pracowników · {customers} klientów</div>
                  <div className="mt-0.5 text-slate-400">dodana {formatDateTime(tenant.created_at)}</div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
