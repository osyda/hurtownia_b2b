'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Search, ShoppingCart, AlertCircle } from 'lucide-react'
import { useCart } from '@/lib/cart-store'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

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
  image_url: string | null
  category_id: string | null
  customer_price: number
  category_name: string | null
}

interface Category {
  id: string
  name: string
}

interface Props {
  tenantSlug: string
  brandColor: string
  categories: Category[]
  products: Product[]
  searchQuery?: string
  activeCategory?: string
}

export function ProductCatalog({ tenantSlug, brandColor, categories, products, searchQuery, activeCategory }: Props) {
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
    router.push(`/sklep/${tenantSlug}/katalog?${sp.toString()}`)
  }

  return (
    <div className="flex gap-6">
      {/* Sidebar kategorii */}
      <aside className="hidden md:block w-52 flex-shrink-0">
        <div className="premium-card sticky top-24 p-3">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 mb-2">Kategorie</div>
          <button
            onClick={() => navigate({ q: searchQuery })}
            className={cn(
              'w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition-all',
              !activeCategory ? 'text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
            )}
            style={!activeCategory ? { backgroundColor: brandColor } : {}}
          >
            Wszystkie
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => navigate({ q: searchQuery, category: cat.id })}
              className={cn(
                'w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition-all',
                activeCategory === cat.id ? 'text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
              )}
              style={activeCategory === cat.id ? { backgroundColor: brandColor } : {}}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </aside>

      {/* Lista produktów */}
      <div className="flex-1 min-w-0">
        {/* Wyszukiwarka */}
        <form
          onSubmit={e => { e.preventDefault(); const q = (e.currentTarget.elements.namedItem('q') as HTMLInputElement).value; navigate({ q, category: activeCategory }) }}
          className="flex gap-2 mb-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              name="q"
              defaultValue={searchQuery}
              placeholder="Szukaj produktu..."
              className="premium-input w-full pl-9"
            />
          </div>
          <button type="submit" className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90" style={{ backgroundColor: brandColor }}>
            Szukaj
          </button>
        </form>

        {/* Kategorie mobile */}
        <div className="flex gap-2 overflow-x-auto pb-2 md:hidden mb-4">
          <button onClick={() => navigate({ q: searchQuery })} className={cn('px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors', !activeCategory ? 'text-white' : 'bg-white border text-gray-600')} style={!activeCategory ? { backgroundColor: brandColor } : {}}>
            Wszystkie
          </button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => navigate({ q: searchQuery, category: cat.id })} className={cn('px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors', activeCategory === cat.id ? 'text-white' : 'bg-white border text-gray-600')} style={activeCategory === cat.id ? { backgroundColor: brandColor } : {}}>
              {cat.name}
            </button>
          ))}
        </div>

        <div className="text-sm text-gray-500 mb-3">{products.length} produktów</div>

        {products.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {products.map(product => {
              const unavailable = product.stock_status === 'unavailable'
              return (
                <div key={product.id} className={cn('premium-card flex flex-col gap-3 p-4 transition hover:-translate-y-0.5', unavailable && 'opacity-60')}>
                  <div className="flex-1">
                    {product.category_name && (
                      <div className="text-xs text-gray-400 mb-1">{product.category_name}</div>
                    )}
                    <div className="font-medium text-gray-900 text-sm leading-tight">{product.name}</div>
                    {product.sku && <div className="text-xs text-gray-400 mt-0.5">SKU: {product.sku}</div>}

                    {product.stock_status === 'limited' && (
                      <div className="flex items-center gap-1 text-orange-500 text-xs mt-1">
                        <AlertCircle className="h-3 w-3" /> Ograniczona dostępność
                      </div>
                    )}
                    {unavailable && (
                      <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                        <AlertCircle className="h-3 w-3" /> Niedostępny
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex items-baseline justify-between mb-2">
                      <div>
                        <span className="text-lg font-bold text-gray-900">{formatCurrency(product.customer_price)}</span>
                        <span className="text-xs text-gray-400 ml-1">/ {product.unit} netto</span>
                      </div>
                      <span className="text-xs text-gray-400">VAT {product.vat_rate}%</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Pole ilości */}
                      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQty(product.id, -product.order_multiple, product)}
                          className="px-2.5 py-1.5 text-gray-600 hover:bg-gray-100 transition-colors text-sm font-medium"
                          disabled={unavailable}
                        >−</button>
                        <input
                          type="number"
                          value={quantities[product.id] ?? product.min_order_qty}
                          min={product.min_order_qty}
                          step={product.order_multiple}
                          onChange={e => setQuantities(prev => ({ ...prev, [product.id]: parseFloat(e.target.value) || product.min_order_qty }))}
                          className="w-14 text-center text-sm py-1.5 border-x border-gray-300 focus:outline-none"
                          disabled={unavailable}
                        />
                        <button
                          onClick={() => updateQty(product.id, product.order_multiple, product)}
                          className="px-2.5 py-1.5 text-gray-600 hover:bg-gray-100 transition-colors text-sm font-medium"
                          disabled={unavailable}
                        >+</button>
                      </div>
                      <span className="text-xs text-gray-400">{product.unit}</span>

                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={unavailable}
                        className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
                        style={{ backgroundColor: brandColor }}
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        Dodaj
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="premium-card p-16 text-center">
            <p className="text-gray-500">Brak produktów spełniających kryteria</p>
          </div>
        )}
      </div>
    </div>
  )
}
