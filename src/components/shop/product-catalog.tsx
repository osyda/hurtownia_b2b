'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, Check, LayoutGrid, Search, ShoppingCart, Table2 } from 'lucide-react'
import type { ComponentType } from 'react'
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { useCart } from '@/lib/cart-store'
import { resolveAccentColor, resolveBrandColor } from '@/lib/brand'
import { cn, formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { CartQuantityControl } from './cart-quantity-control'
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

type CatalogViewMode = 'cards' | 'table'

const VIEW_MODE_KEY = 'dostawio-catalog-view'

function isCatalogViewMode(value: string | null): value is CatalogViewMode {
  return value === 'cards' || value === 'table'
}

function normalizeSearch(value: string) {
  return value
    .toLocaleLowerCase('pl-PL')
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function productMatchesSearch(product: Product, query: string) {
  const terms = normalizeSearch(query).split(/\s+/).filter(Boolean)
  if (!terms.length) return true

  const haystack = normalizeSearch([
    product.name,
    product.sku,
    product.category_name,
    product.unit,
  ].filter(Boolean).join(' '))

  return terms.every(term => haystack.includes(term))
}

function StockNotice({ product }: { product: Product }) {
  if (product.stock_status === 'limited') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600">
        <AlertCircle className="h-3.5 w-3.5" /> Ograniczona dostępność
      </span>
    )
  }

  if (product.stock_status === 'unavailable') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
        <AlertCircle className="h-3.5 w-3.5" /> Niedostępny
      </span>
    )
  }

  return null
}

function ProductActions({
  product,
  qty,
  justAdded,
  compact,
  resolvedBrandColor,
  resolvedAccentColor,
  onQtyChange,
  onAdd,
}: {
  product: Product
  qty: number
  justAdded: boolean
  compact?: boolean
  resolvedBrandColor: string
  resolvedAccentColor: string
  onQtyChange: (qty: number) => void
  onAdd: () => void
}) {
  const unavailable = product.stock_status === 'unavailable'

  return (
    <div className={cn('flex items-center gap-2', compact && 'gap-1.5')}>
      <CartQuantityControl
        value={qty}
        min={product.min_order_qty}
        step={product.order_multiple}
        unit={product.unit}
        size="sm"
        disabled={unavailable}
        onChange={onQtyChange}
      />
      <button
        type="button"
        onClick={onAdd}
        disabled={unavailable}
        className={cn(
          'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 active:scale-95 disabled:translate-y-0 disabled:opacity-40',
          compact && 'h-8 px-2.5 text-xs',
          justAdded && 'button-added'
        )}
        style={{ backgroundColor: justAdded ? resolvedAccentColor : resolvedBrandColor }}
      >
        {justAdded ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
        {justAdded ? 'Dodano' : 'Dodaj'}
      </button>
    </div>
  )
}

function ProductCard({
  product,
  index,
  shopBasePath,
  qty,
  justAdded,
  resolvedBrandColor,
  resolvedAccentColor,
  onQtyChange,
  onAdd,
}: {
  product: Product
  index: number
  shopBasePath: string
  qty: number
  justAdded: boolean
  resolvedBrandColor: string
  resolvedAccentColor: string
  onQtyChange: (qty: number) => void
  onAdd: () => void
}) {
  const unavailable = product.stock_status === 'unavailable'

  return (
    <article
      className={cn(
        'premium-card motion-card flex flex-col border-[#E7E1D6] bg-white p-3 transition duration-200 hover:-translate-y-0.5 sm:p-4',
        unavailable && 'opacity-60',
        justAdded && 'card-added'
      )}
      style={{ animationDelay: `${Math.min(index, 8) * 24}ms` }}
    >
      <div className="flex flex-1 flex-col gap-3">
        <div>
          <div className="mb-2 flex min-h-6 items-center justify-between gap-2">
            {product.category_name ? (
              <span className="rounded-full bg-[#F8F5EF] px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                {product.category_name}
              </span>
            ) : <span />}
            <Link
              href={`${shopBasePath}/katalog/${product.id}`}
              className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 transition hover:text-slate-700"
            >
              Szczegóły
            </Link>
          </div>
          <h2 className="line-clamp-2 min-h-[2.25rem] text-sm font-semibold leading-tight text-slate-900">
            {product.name}
          </h2>
          <div className="mt-2 flex items-center justify-between gap-2 text-[11px] font-medium text-slate-400 sm:text-xs">
            {product.sku ? <span className="truncate">SKU: {product.sku}</span> : <span />}
            <span>VAT {product.vat_rate}%</span>
          </div>
          <div className="mt-2">
            <StockNotice product={product} />
          </div>
        </div>

        <div className="rounded-lg bg-[#FBF8F3] p-3">
          <div className="flex items-end justify-between gap-2">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Cena netto</div>
              <div className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                {formatCurrency(product.customer_price)}
              </div>
            </div>
            <div className="text-right text-xs font-semibold text-slate-400">/ {product.unit}</div>
          </div>
        </div>

        <ProductActions
          product={product}
          qty={qty}
          justAdded={justAdded}
          resolvedBrandColor={resolvedBrandColor}
          resolvedAccentColor={resolvedAccentColor}
          onQtyChange={onQtyChange}
          onAdd={onAdd}
        />
      </div>
    </article>
  )
}

function ProductTableRow({
  product,
  qty,
  justAdded,
  resolvedBrandColor,
  resolvedAccentColor,
  onQtyChange,
  onAdd,
}: {
  product: Product
  qty: number
  justAdded: boolean
  resolvedBrandColor: string
  resolvedAccentColor: string
  onQtyChange: (qty: number) => void
  onAdd: () => void
}) {
  const unavailable = product.stock_status === 'unavailable'

  return (
    <div className={cn(
      'grid min-w-[760px] grid-cols-[minmax(230px,1.5fr)_110px_80px_120px_190px] items-center gap-3 border-t border-[#EEE7DC] px-3 py-2.5 text-sm',
      unavailable && 'opacity-60'
    )}>
      <div className="min-w-0">
        <div className="truncate font-medium text-slate-900">{product.name}</div>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-400">
          <span className="truncate">{product.category_name || 'Bez kategorii'}</span>
          <StockNotice product={product} />
        </div>
      </div>
      <div className="truncate text-xs font-medium text-slate-500">{product.sku || '-'}</div>
      <div className="text-xs font-medium text-slate-500">VAT {product.vat_rate}%</div>
      <div>
        <div className="font-semibold text-slate-900">{formatCurrency(product.customer_price)}</div>
        <div className="text-[11px] text-slate-400">/ {product.unit}</div>
      </div>
      <ProductActions
        product={product}
        qty={qty}
        justAdded={justAdded}
        compact
        resolvedBrandColor={resolvedBrandColor}
        resolvedAccentColor={resolvedAccentColor}
        onQtyChange={onQtyChange}
        onAdd={onAdd}
      />
    </div>
  )
}

export function ProductCatalog({ brandColor, categories, products, searchQuery, activeCategory, shopBasePath }: Props) {
  const router = useRouter()
  const { addItem } = useCart()
  const resolvedBrandColor = resolveBrandColor(brandColor)
  const resolvedAccentColor = resolveAccentColor(brandColor)
  const addedResetTimer = useRef<number | null>(null)
  const [addedProductId, setAddedProductId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<CatalogViewMode>('cards')
  const [liveSearch, setLiveSearch] = useState(searchQuery ?? '')
  const deferredSearch = useDeferredValue(liveSearch)
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(products.map(p => [p.id, p.min_order_qty]))
  )

  const visibleProducts = useMemo(
    () => products.filter(product => productMatchesSearch(product, deferredSearch)),
    [products, deferredSearch]
  )

  useEffect(() => {
    const savedViewMode = window.localStorage.getItem(VIEW_MODE_KEY)
    if (isCatalogViewMode(savedViewMode)) setViewMode(savedViewMode)
  }, [])

  useEffect(() => {
    setLiveSearch(searchQuery ?? '')
  }, [searchQuery])

  useEffect(() => {
    setQuantities(prev => {
      const next = { ...prev }
      products.forEach(product => {
        if (next[product.id] === undefined) next[product.id] = product.min_order_qty
      })
      return next
    })
  }, [products])

  useEffect(() => {
    return () => {
      if (addedResetTimer.current) {
        window.clearTimeout(addedResetTimer.current)
      }
    }
  }, [])

  function selectViewMode(mode: CatalogViewMode) {
    setViewMode(mode)
    window.localStorage.setItem(VIEW_MODE_KEY, mode)
  }

  function setProductQty(product: Product, qty: number) {
    setQuantities(prev => ({
      ...prev,
      [product.id]: Math.max(product.min_order_qty, Number(qty.toFixed(3))),
    }))
  }

  function handleAddToCart(product: Product) {
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

  function renderProduct(product: Product, index: number) {
    const qty = quantities[product.id] ?? product.min_order_qty
    const justAdded = addedProductId === product.id
    const sharedProps = {
      product,
      qty,
      justAdded,
      resolvedBrandColor,
      resolvedAccentColor,
      onQtyChange: (nextQty: number) => setProductQty(product, nextQty),
      onAdd: () => handleAddToCart(product),
    }

    if (viewMode === 'table') return <ProductTableRow key={product.id} {...sharedProps} />
    return (
      <ProductCard
        key={product.id}
        index={index}
        shopBasePath={shopBasePath}
        {...sharedProps}
      />
    )
  }

  const viewOptions: Array<{ mode: CatalogViewMode; label: string; icon: ComponentType<{ className?: string }> }> = [
    { mode: 'cards', label: 'Karty', icon: LayoutGrid },
    { mode: 'table', label: 'Tabela', icon: Table2 },
  ]

  return (
    <div className="grid gap-3 lg:grid-cols-[210px_minmax(0,1fr)_310px] lg:gap-4 xl:grid-cols-[230px_minmax(0,1fr)_340px]">
      <aside className="hidden lg:block">
        <div className="premium-card sticky top-24 overflow-hidden border-[#E7E1D6] bg-white">
          <div className="border-b border-[#E7E1D6] bg-[#F8F5EF] px-4 py-4">
            <div className="text-sm font-semibold text-slate-800">Kategorie</div>
            <div className="mt-1 text-xs text-slate-500">{categories.length} grup produktów</div>
          </div>
          <div className="space-y-1 p-3">
            <button
              type="button"
              onClick={() => navigate({ q: liveSearch || undefined })}
              className={cn(
                'w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-all active:scale-95',
                !activeCategory ? 'text-white shadow-sm' : 'text-slate-600 hover:bg-[#F8F5EF] hover:text-slate-900'
              )}
              style={!activeCategory ? { backgroundColor: resolvedBrandColor } : {}}
            >
              Wszystkie produkty
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => navigate({ q: liveSearch || undefined, category: cat.id })}
                className={cn(
                  'w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-all active:scale-95',
                  activeCategory === cat.id ? 'text-white shadow-sm' : 'text-slate-600 hover:bg-[#F8F5EF] hover:text-slate-900'
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
        <section className="premium-card overflow-hidden border-[#E7E1D6] bg-white">
          <div className="grid gap-3 p-3 lg:grid-cols-[1fr_auto] lg:items-center sm:p-4">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 sm:text-xs">Katalog produktów</div>
              <h1 className="mt-0.5 text-lg font-semibold tracking-tight text-slate-900 sm:mt-1 sm:text-2xl">
                {visibleProducts.length} z {products.length} pozycji w ofercie
              </h1>
            </div>

            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-end">
              <div className="inline-flex w-fit rounded-lg border border-[#D9D5CC] bg-white p-1 shadow-sm">
                {viewOptions.map(option => {
                  const Icon = option.icon
                  const active = viewMode === option.mode

                  return (
                    <button
                      key={option.mode}
                      type="button"
                      onClick={() => selectViewMode(option.mode)}
                      className={cn(
                        'inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition',
                        active ? 'text-white shadow-sm' : 'text-slate-500 hover:bg-[#F8F5EF] hover:text-slate-800'
                      )}
                      style={active ? { backgroundColor: resolvedBrandColor } : {}}
                      aria-pressed={active}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {option.label}
                    </button>
                  )
                })}
              </div>

              <form
                onSubmit={e => {
                  e.preventDefault()
                  navigate({ q: liveSearch || undefined, category: activeCategory })
                }}
                className="flex min-w-0 gap-2 md:w-[360px]"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    name="q"
                    value={liveSearch}
                    onChange={event => setLiveSearch(event.target.value)}
                    placeholder="Wpisz np. ml, jablko, SKU..."
                    className="premium-input h-9 w-full pl-9 sm:h-10"
                    autoComplete="off"
                  />
                </div>
                <button type="submit" className="brand-button px-3 py-1.5 text-xs font-semibold sm:px-4 sm:py-2.5 sm:text-sm">
                  Szukaj
                </button>
              </form>
            </div>
          </div>
        </section>

        <div className="no-scrollbar -mx-3 flex gap-1.5 overflow-x-auto px-3 pb-1 lg:hidden">
          <button
            type="button"
            onClick={() => navigate({ q: liveSearch || undefined })}
            className={cn(
              'whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-all active:scale-95',
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
              onClick={() => navigate({ q: liveSearch || undefined, category: cat.id })}
              className={cn(
                'whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-all active:scale-95',
                activeCategory === cat.id ? 'text-white shadow-sm' : 'border border-[#E2DCD0] bg-white text-slate-600 shadow-sm'
              )}
              style={activeCategory === cat.id ? { backgroundColor: resolvedBrandColor } : {}}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {visibleProducts.length ? (
          viewMode === 'table' ? (
            <div className="premium-card overflow-x-auto border-[#E7E1D6] bg-white">
              <div className="grid min-w-[760px] grid-cols-[minmax(230px,1.5fr)_110px_80px_120px_190px] gap-3 bg-[#F8F5EF] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                <span>Produkt</span>
                <span>SKU</span>
                <span>VAT</span>
                <span>Cena</span>
                <span>Ilość</span>
              </div>
              {visibleProducts.map(renderProduct)}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5 sm:gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3">
              {visibleProducts.map(renderProduct)}
            </div>
          )
        ) : (
          <div className="premium-card p-10 text-center sm:p-16">
            <p className="text-sm font-medium text-slate-500">Brak produktów spełniających kryteria.</p>
          </div>
        )}
      </div>

      <QuickCartPanel brandColor={brandColor} shopBasePath={shopBasePath} />
    </div>
  )
}
