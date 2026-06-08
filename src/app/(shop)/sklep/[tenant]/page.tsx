import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { ChevronRight, ClipboardList, RotateCcw, ShoppingCart } from 'lucide-react'
import { formatCurrency, formatDate, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '@/lib/utils'

export default async function ShopDashboardPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: tenantSlug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: customer } = await supabase
    .from('customers')
    .select('id, company_name, tenants(customer_message, brand_color, name)')
    .eq('user_id', user.id)
    .single()

  if (!customer) redirect('/login')

  const tenantInfo = customer.tenants as unknown as {
    customer_message: string | null
    brand_color: string
    name: string
  } | null

  const { data: recentOrders } = await supabase
    .from('orders')
    .select('id, order_number, status, total_gross, created_at, delivery_date')
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: lastOrder } = await supabase
    .from('orders')
    .select('id, order_items(product_id, product_name, ordered_qty, product_unit)')
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const base = `/sklep/${tenantSlug}`
  const brandColor = tenantInfo?.brand_color ?? '#0f172a'

  return (
    <div className="space-y-6">
      <section className="premium-card overflow-hidden">
        <div className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Portal zakupowy B2B
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              Witaj, {customer.company_name}
            </h1>
            {tenantInfo?.customer_message ? (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{tenantInfo.customer_message}</p>
            ) : (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Szybko zloz zamowienie, sprawdz historie i ponow ostatnie zakupy.
              </p>
            )}
          </div>
          <Link
            href={`${base}/katalog`}
            className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90"
            style={{ backgroundColor: brandColor }}
          >
            <ShoppingCart className="h-4 w-4" />
            Zloz zamowienie
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="premium-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200/80 p-5">
            <h2 className="font-semibold text-slate-950">Ostatnie zamowienia</h2>
            <Link href={`${base}/zamowienia`} className="flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-950">
              Wszystkie <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentOrders?.length ? recentOrders.map(order => (
              <Link
                key={order.id}
                href={`${base}/zamowienia/${order.id}`}
                className="flex items-center justify-between gap-4 p-4 transition hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <div className="font-mono text-sm font-semibold text-slate-950">{order.order_number}</div>
                  <div className="mt-0.5 text-xs text-slate-400">{formatDate(order.created_at)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ORDER_STATUS_COLORS[order.status]}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                  <span className="text-sm font-semibold text-slate-950">{formatCurrency(order.total_gross)}</span>
                </div>
              </Link>
            )) : (
              <div className="p-8 text-center text-sm text-slate-400">Brak zamowien</div>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <ActionLink
            href={`${base}/katalog`}
            icon={<ShoppingCart className="h-5 w-5" />}
            title="Przegladaj produkty"
            description="Znajdz produkty i dodaj je do koszyka"
            color="text-sky-700 bg-sky-50"
          />
          <ActionLink
            href={`${base}/zamowienia`}
            icon={<ClipboardList className="h-5 w-5" />}
            title="Historia zamowien"
            description="Przegladaj poprzednie zamowienia i statusy"
            color="text-emerald-700 bg-emerald-50"
          />
          {lastOrder && (
            <ActionLink
              href={`${base}/zamowienia/${lastOrder.id}?reorder=1`}
              icon={<RotateCcw className="h-5 w-5" />}
              title="Zamow ponownie"
              description="Powtorz ostatnie zamowienie"
              color="text-amber-700 bg-amber-50"
            />
          )}
        </section>
      </div>
    </div>
  )
}

function ActionLink({
  href,
  icon,
  title,
  description,
  color,
}: {
  href: string
  icon: ReactNode
  title: string
  description: string
  color: string
}) {
  return (
    <Link href={href} className="premium-card group flex items-center gap-4 p-4 transition hover:-translate-y-0.5">
      <div className={`rounded-lg p-3 transition ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="font-semibold text-slate-950">{title}</div>
        <div className="text-sm text-slate-500">{description}</div>
      </div>
      <ChevronRight className="ml-auto h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5" />
    </Link>
  )
}
