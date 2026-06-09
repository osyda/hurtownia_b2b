'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, Search, ShoppingCart } from 'lucide-react'
import { useCart } from '@/lib/cart-store'
import { cn, formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { useState } from 'react'

interface Product {
  id: string
  name: string
  sku: string | null
  unit: string
  base_price: number
  vat_rate: number
  min_order_qty: number
  order_multiple: number
  stock_status: string
  category_id: string | null
  customer_price: number
  category_name: string | null
}

interface Category {
  id: string
  name: string
}

interface Props {
  brandColor: string
  categories: Category[]
  products: Product[]
  searchQuery?: string
  activeCategory?: string
  shopBasePath: string
}

export function ProductCatalog({ brandColor, categories, products, searchQuery, activeCategory, shopBasePath }: Props) {
  const router = useRouter()
  const { addItem } = useCart()
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(products.map(p => [p.id, p.min_order_qty]))
  )

  const updateQty = (id: string, delta: number, product: Product) => {
    setQuantities(prev => {
      const current = prev[id] ?? product.min_order_qty
      const next = Math.max(product.min_order_qty, Number((current + delta).toFixed(3)))
      return { ...prev, [id]: next }
    })
  }

  const handleAddToCart = (product: Product) => {
    if (product.stock_status === 'unavailable') {
      toast.error('Ten produkt jest niedostępny')
      return
    }

    addItem({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      unit: product.unit,
      price: product.customer_price,
      vatRate: product.vat_rate,
      qty: quantities[product.id] ?? product.min_order_qty,
      minQty: product.min_order_qty,
      multiple: product.order_multiple,
    })
    toast.success(`Dodano: ${product.name}`)
  }

  function navigate(params: Record<string, string | undefined>) {
    const sp = new URLSearchParams()
    if (params.q) sp.set('q', params.q)
    if (params.category) sp.set('category', params.category)
    const query = sp.toString()
    router.push(`${shopBasePath}/katalog${query ? `?${query}` : ''}`)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="hidden lg:block">
        <div className="premium-card sticky top-24 overflow-hidden">
          <div className="border-b border-slate-200/80 bg-slate-950 px-4 py-4 text-white">
            <div className="text-sm font-black">Kategorie</div>
            <div className="mt-1 text-xs text-slate-400">{categories.length} grup produktow</div>
          </div>
          <div className="space-y-1 p-3">
            <button
              type="button"
              onClick={() => navigate({ q: searchQuery })}
              className={cn(
                'w-full rounded-lg px-3 py-2.5 text-left text-sm font-bold transition-all',
                !activeCategory ? 'text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
              )}
              style={!activeCategory ? { backgroundColor: brandColor } : {}}
            >
              Wszystkie produkty
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => navigate({ q: searchQuery, category: cat.id })}
                className={cn(
                  'w-full rounded-lg px-3 py-2.5 text-left text-sm font-bold transition-all',
                  activeCategory === cat.id ? 'text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                )}
                style={activeCategory === cat.id ? { backgroundColor: brandColor } : {}}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="min-w-0 space-y-5">
        <section className="premium-card overflow-hidden">
          <div className="grid gap-4 p-4 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Katalog produktow</div>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                {products.length} pozycji w ofercie
              </h1>
            </div>
            <form
              onSubmit={e => {
                e.preventDefault()
                const q = (e.currentTarget.elements.namedItem('q') as HTMLInputElement).value
                navigate({ q, category: activeCategory })
              }}
              className="flex min-w-0 gap-2 md:w-[420px]"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="Szukaj produktu, SKU, kategorii..."
                  className="premium-input w-full pl-9"
                />
              </div>
              <button
                type="submit"
                className="rounded-lg px-4 py-2.5 text-sm font-black text-white shadow-sm transition-all hover:-translate-y-0.5"
                style={{ backgroundColor: brandColor }}
              >
                Szukaj
              </button>
            </form>
          </div>
        </section>

        <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
          <button
            type="button"
            onClick={() => navigate({ q: searchQuery })}
            className={cn('whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-bold transition-colors', !activeCategory ? 'text-white' : 'border bg-white text-slate-600')}
            style={!activeCategory ? { backgroundColor: brandColor } : {}}
          >
            Wszystkie
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => navigate({ q: searchQuery, category: cat.id })}
              className={cn('whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-bold transition-colors', activeCategory === cat.id ? 'text-white' : 'border bg-white text-slate-600')}
              style={activeCategory === cat.id ? { backgroundColor: brandColor } : {}}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {products.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {products.map(product => {
              const unavailable = product.stock_status === 'unavailable'
              const limited = product.stock_status === 'limited'

              return (
                <article key={product.id} className={cn('premium-card flex flex-col p-4 transition hover:-translate-y-1', unavailable && 'opacity-60')}>
                  <div className="flex flex-1 flex-col space-y-4">
                    <div>
                      <div className="mb-3 flex min-h-7 items-center justify-between gap-3">
                        {product.category_name ? (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                            {product.category_name}
                          </span>
                        ) : (
                          <span />
                        )}
                        <Link
                          href={`${shopBasePath}/katalog/${product.id}`}
                          className="text-xs font-black uppercase tracking-[0.14em] text-slate-400 transition hover:text-slate-950"
                        >
                          Szczegóły
                        </Link>
                      </div>
                      <h2 className="line-clamp-2 min-h-[2.5rem] text-sm font-black leading-tight text-slate-950">
                        {product.name}
                      </h2>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        {product.sku ? <span className="truncate text-xs font-semibold text-slate-400">SKU: {product.sku}</span> : <span />}
                        <span className="text-xs font-semibold text-slate-400">VAT {product.vat_rate}%</span>
                      </div>

                      {limited && (
                        <div className="mt-2 flex items-center gap-1 text-xs font-bold text-orange-600">
                          <AlertCircle className="h-3.5 w-3.5" /> Ograniczona dostępność
                        </div>
                      )}
                      {unavailable && (
                        <div className="mt-2 flex items-center gap-1 text-xs font-bold text-red-600">
                          <AlertCircle className="h-3.5 w-3.5" /> Niedostepny
                        </div>
                      )}
                    </div>

                    <div className="rounded-lg bg-slate-50 p-3">
                      <div className="flex items-end justify-between gap-2">
                        <div>
                          <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Cena netto</div>
                          <div className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                            {formatCurrency(product.customer_price)}
                          </div>
                        </div>
                        <div className="text-right text-xs font-bold text-slate-400">/ {product.unit}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex overflow-hidden rounded-lg border border-slate-300 bg-white">
                        <button
                          type="button"
                          onClick={() => updateQty(product.id, -product.order_multiple, product)}
                          className="px-3 py-2 text-sm font-black text-slate-600 transition hover:bg-slate-100"
                          disabled={unavailable}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={quantities[product.id] ?? product.min_order_qty}
                          min={product.min_order_qty}
                          step={product.order_multiple}
                          onChange={e => setQuantities(prev => ({ ...prev, [product.id]: parseFloat(e.target.value) || product.min_order_qty }))}
                          className="w-16 border-x border-slate-300 py-2 text-center text-sm font-bold focus:outline-none"
                          disabled={unavailable}
                        />
                        <button
                          type="button"
                          onClick={() => updateQty(product.id, product.order_multiple, product)}
                          className="px-3 py-2 text-sm font-black text-slate-600 transition hover:bg-slate-100"
                          disabled={unavailable}
                        >
                          +
                        </button>
                      </div>
                      <span className="text-xs font-bold text-slate-400">{product.unit}</span>

                      <button
                        type="button"
                        onClick={() => handleAddToCart(product)}
                        disabled={unavailable}
                        className="ml-auto inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-40"
                        style={{ backgroundColor: brandColor }}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        Dodaj
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="premium-card p-16 text-center">
            <p className="text-sm font-semibold text-slate-500">Brak produktow spelniajacych kryteria.</p>
          </div>
        )}
      </div>
    </div>
  )
}
