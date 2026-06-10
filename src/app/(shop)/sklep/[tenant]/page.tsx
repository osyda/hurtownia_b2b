import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { ChevronRight, ClipboardList, PackageSearch, RotateCcw, ShoppingCart, Sparkles } from 'lucide-react'
import { getShopBasePath } from '@/lib/shop-routing'
import { resolveBrandColor } from '@/lib/brand'
import { formatCurrency, formatDate, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '@/lib/utils'

export default async function ShopDashboardPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: tenantSlug } = await params
  const shopBasePath = getShopBasePath(tenantSlug, (await headers()).get('host'))
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

  const base = shopBasePath
  const brandColor = resolveBrandColor(tenantInfo?.brand_color ?? '#1D2125')
  const orderTotal = recentOrders?.reduce((sum, order) => sum + (order.total_gross || 0), 0) ?? 0

  return (
    <div className="space-y-5">
      <section className="premium-hero p-5 md:p-7">
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_290px] lg:items-end">
          <div>
            <div className="premium-pill mb-5">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              Portal zakupowy B2B
            </div>
            <h1 className="max-w-3xl text-2xl font-black tracking-tight md:text-4xl">
              Witaj, {customer.company_name}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
              {tenantInfo?.customer_message || 'Szybko zamów produkty, sprawdź status i powtórz ostatnie zakupy.'}
            </p>
            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
              <Link
                href={`${base}/katalog`}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5"
                style={{ backgroundColor: brandColor }}
              >
                <ShoppingCart className="h-4 w-4" />
                Złóż zamówienie
              </Link>
              <Link
                href={`${base}/zamowienia`}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/15"
              >
                Historia zamówień
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/10 p-4 backdrop-blur">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Ostatnie zamówienia</div>
            <div className="mt-2 text-3xl font-black">{recentOrders?.length ?? 0}</div>
            <div className="mt-2 text-sm text-slate-300">{formatCurrency(orderTotal)} w ostatnich pozycjach</div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ActionLink
          href={`${base}/katalog`}
          icon={<PackageSearch className="h-5 w-5" />}
          title="Przeglądaj katalog"
          description="Produkty, ceny i dostępność"
          color="from-[#1D2125] to-[#E08A2B]"
        />
        <ActionLink
          href={`${base}/zamowienia`}
          icon={<ClipboardList className="h-5 w-5" />}
          title="Historia zamówień"
          description="Statusy i szczegóły dostaw"
          color="from-[#E08A2B] to-[#C7741F]"
        />
        {lastOrder ? (
          <ActionLink
            href={`${base}/zamowienia/${lastOrder.id}?reorder=1`}
            icon={<RotateCcw className="h-5 w-5" />}
            title="Zamów ponownie"
            description="Powtórz ostatni koszyk"
            color="from-[#1D2125] to-[#1D2125]"
          />
        ) : (
          <ActionLink
            href={`${base}/katalog`}
            icon={<ShoppingCart className="h-5 w-5" />}
            title="Pierwsze zamówienie"
            description="Rozpocznij od katalogu"
            color="from-[#1D2125] to-[#363A3D]"
          />
        )}
      </section>

      <section className="premium-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200/80 bg-white px-5 py-4">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-950">Ostatnie zamówienia</h2>
            <p className="text-sm text-slate-500">Szybki podgląd statusów i wartości.</p>
          </div>
          <Link href={`${base}/zamowienia`} className="brand-button px-3 py-2 text-sm">
            Wszystkie
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {recentOrders?.length ? recentOrders.map(order => (
            <Link
              key={order.id}
              href={`${base}/zamowienia/${order.id}`}
              className="premium-table-row grid gap-3 p-4 md:grid-cols-[1fr_auto_auto] md:items-center"
            >
              <div className="min-w-0">
                <div className="font-mono text-sm font-black text-slate-950">{order.order_number}</div>
                <div className="mt-1 text-xs text-slate-400">{formatDate(order.created_at)}</div>
              </div>
              <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-bold ${ORDER_STATUS_COLORS[order.status]}`}>
                {ORDER_STATUS_LABELS[order.status]}
              </span>
              <span className="text-sm font-black text-slate-950 md:text-right">{formatCurrency(order.total_gross)}</span>
            </Link>
          )) : (
            <div className="p-10 text-center text-sm text-slate-400">Brak zamówień</div>
          )}
        </div>
      </section>
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
    <Link href={href} className="premium-stat-card group block overflow-hidden">
      <div className="mb-5 flex items-center justify-between">
        <div className={`rounded-lg bg-gradient-to-br ${color} p-2.5 text-white shadow-sm`}>
          {icon}
        </div>
        <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-600" />
      </div>
      <div className="text-lg font-black text-slate-950">{title}</div>
      <div className="mt-1 text-sm font-medium text-slate-500">{description}</div>
    </Link>
  )
}
