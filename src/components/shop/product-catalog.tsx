'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, Check, Search, ShoppingCart } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useCart } from '@/lib/cart-store'
import { resolveAccentColor, resolveBrandColor } from '@/lib/brand'
import { cn, formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { QuickCartPanel } from './quick-cart-panel'

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
  const resolvedBrandColor = resolveBrandColor(brandColor)
  const resolvedAccentColor = resolveAccentColor(brandColor)
  const addedResetTimer = useRef<number | null>(null)
  const [addedProductId, setAddedProductId] = useState<string | null>(null)
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(products.map(p => [p.id, p.min_order_qty]))
  )

  useEffect(() => {
    return () => {
      if (addedResetTimer.current) {
        window.clearTimeout(addedResetTimer.current)
      }
    }
  }, [])

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

    setAddedProductId(product.id)
    if (addedResetTimer.current) {
      window.clearTimeout(addedResetTimer.current)
    }
    addedResetTimer.current = window.setTimeout(() => {
      setAddedProductId(current => (current === product.id ? null : current))
    }, 900)
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
    <div className="grid gap-3 lg:grid-cols-[210px_minmax(0,1fr)_310px] lg:gap-4 xl:grid-cols-[230px_minmax(0,1fr)_340px]">
      <aside className="hidden lg:block">
        <div className="premium-card sticky top-24 overflow-hidden">
          <div className="brand-gradient border-b border-slate-200/80 px-4 py-4 text-white">
            <div className="text-sm font-black">Kategorie</div>
            <div className="mt-1 text-xs text-white/65">{categories.length} grup produktów</div>
          </div>
          <div className="space-y-1 p-3">
            <button
              type="button"
              onClick={() => navigate({ q: searchQuery })}
              className={cn(
                'w-full rounded-lg px-3 py-2.5 text-left text-sm font-bold transition-all active:scale-95',
                !activeCategory ? 'text-white shadow-sm' : 'text-slate-600 hover:bg-[#F4F1EC] hover:text-slate-950'
              )}
              style={!activeCategory ? { backgroundColor: resolvedBrandColor } : {}}
            >
              Wszystkie produkty
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => navigate({ q: searchQuery, category: cat.id })}
                className={cn(
                  'w-full rounded-lg px-3 py-2.5 text-left text-sm font-bold transition-all active:scale-95',
                  activeCategory === cat.id ? 'text-white shadow-sm' : 'text-slate-600 hover:bg-[#F4F1EC] hover:text-slate-950'
                )}
                style={activeCategory === cat.id ? { backgroundColor: resolvedBrandColor } : {}}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="min-w-0 space-y-3 sm:space-y-5">
        <section className="premium-card overflow-hidden">
          <div className="grid gap-2.5 p-2.5 md:grid-cols-[1fr_auto] md:items-center sm:gap-3 sm:p-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 sm:text-xs">Katalog produktów</div>
              <h1 className="mt-0.5 text-lg font-black tracking-tight text-slate-950 sm:mt-1 sm:text-2xl">
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
                  className="premium-input h-9 w-full pl-9 sm:h-10"
                />
              </div>
              <button type="submit" className="brand-button px-3 py-1.5 text-xs sm:px-4 sm:py-2.5 sm:text-sm">
                Szukaj
              </button>
            </form>
          </div>
        </section>

        <div className="-mx-3 flex gap-1.5 overflow-x-auto px-3 pb-1 lg:hidden">
          <button
            type="button"
            onClick={() => navigate({ q: searchQuery })}
            className={cn(
              'whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-black transition-all active:scale-95',
              !activeCategory ? 'text-white shadow-sm' : 'border border-[#E2DCD0] bg-white text-slate-600 shadow-sm'
            )}
            style={!activeCategory ? { backgroundColor: resolvedBrandColor } : {}}
          >
            Wszystkie
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => navigate({ q: searchQuery, category: cat.id })}
              className={cn(
                'whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-black transition-all active:scale-95',
                activeCategory === cat.id ? 'text-white shadow-sm' : 'border border-[#E2DCD0] bg-white text-slate-600 shadow-sm'
              )}
              style={activeCategory === cat.id ? { backgroundColor: resolvedBrandColor } : {}}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {products.length ? (
          <div className="grid grid-cols-1 gap-2.5 sm:gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3">
            {products.map((product, index) => {
              const unavailable = product.stock_status === 'unavailable'
              const limited = product.stock_status === 'limited'
              const justAdded = addedProductId === product.id

              return (
                <article
                  key={product.id}
                  className={cn(
                    'premium-card motion-card flex flex-col p-2.5 transition duration-200 hover:-translate-y-1 sm:p-4',
                    unavailable && 'opacity-60',
                    justAdded && 'card-added'
                  )}
                  style={{ animationDelay: `${Math.min(index, 8) * 28}ms` }}
                >
                  <div className="flex flex-1 flex-col space-y-2.5 sm:space-y-4">
                    <div>
                      <div className="mb-1.5 flex min-h-5 items-center justify-between gap-2 sm:mb-3 sm:min-h-7">
                        {product.category_name ? (
                          <span className="rounded-full bg-[#F4F1EC] px-2 py-0.5 text-[10px] font-bold text-slate-600 sm:px-2.5 sm:py-1 sm:text-xs">
                            {product.category_name}
                          </span>
                        ) : (
                          <span />
                        )}
                        <Link
                          href={`${shopBasePath}/katalog/${product.id}`}
                          className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 transition hover:text-slate-950 sm:text-xs"
                        >
                          Szczegóły
                        </Link>
                      </div>
                      <h2 className="line-clamp-2 min-h-[2rem] text-sm font-black leading-tight text-slate-950 sm:min-h-[2.5rem]">
                        {product.name}
                      </h2>
                      <div className="mt-1.5 flex items-center justify-between gap-2 sm:mt-2">
                        {product.sku ? <span className="truncate text-[11px] font-semibold text-slate-400 sm:text-xs">SKU: {product.sku}</span> : <span />}
                        <span className="text-[11px] font-semibold text-slate-400 sm:text-xs">VAT {product.vat_rate}%</span>
                      </div>

                      {limited && (
                        <div className="mt-2 flex items-center gap-1 text-xs font-bold text-orange-600">
                          <AlertCircle className="h-3.5 w-3.5" /> Ograniczona dostępność
                        </div>
                      )}
                      {unavailable && (
                        <div className="mt-2 flex items-center gap-1 text-xs font-bold text-red-600">
                          <AlertCircle className="h-3.5 w-3.5" /> Niedostępny
                        </div>
                      )}
                    </div>

                    <div className="rounded-lg bg-[#F8F5EF] p-2.5 sm:p-3">
                      <div className="flex items-end justify-between gap-2">
                        <div>
                          <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400 sm:text-xs">Cena netto</div>
                          <div className="mt-0.5 text-base font-black tracking-tight text-slate-950 sm:mt-1 sm:text-lg">
                            {formatCurrency(product.customer_price)}
                          </div>
                        </div>
                        <div className="text-right text-[11px] font-bold text-slate-400 sm:text-xs">/ {product.unit}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="flex overflow-hidden rounded-lg border border-[#D9D5CC] bg-white">
                        <button
                          type="button"
                          onClick={() => updateQty(product.id, -product.order_multiple, product)}
                          className="px-2 py-1 text-sm font-black text-slate-600 transition hover:bg-slate-100 active:scale-95 sm:px-3 sm:py-2"
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
                          className="w-12 border-x border-[#D9D5CC] py-1 text-center text-sm font-bold focus:outline-none sm:w-16 sm:py-2"
                          disabled={unavailable}
                        />
                        <button
                          type="button"
                          onClick={() => updateQty(product.id, product.order_multiple, product)}
                          className="px-2 py-1 text-sm font-black text-slate-600 transition hover:bg-slate-100 active:scale-95 sm:px-3 sm:py-2"
                          disabled={unavailable}
                        >
                          +
                        </button>
                      </div>
                      <span className="text-[11px] font-bold text-slate-400 sm:text-xs">{product.unit}</span>

                      <button
                        type="button"
                        onClick={() => handleAddToCart(product)}
                        disabled={unavailable}
                        className={cn(
                          'ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 active:scale-95 disabled:translate-y-0 disabled:opacity-40 sm:px-3 sm:py-2 sm:text-sm',
                          justAdded && 'button-added'
                        )}
                        style={{ backgroundColor: justAdded ? resolvedAccentColor : resolvedBrandColor }}
                      >
                        {justAdded ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                        {justAdded ? 'Dodano' : 'Dodaj'}
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="premium-card p-10 text-center sm:p-16">
            <p className="text-sm font-semibold text-slate-500">Brak produktów spełniających kryteria.</p>
          </div>
        )}
      </div>

      <QuickCartPanel brandColor={brandColor} shopBasePath={shopBasePath} />
    </div>
  )
}
