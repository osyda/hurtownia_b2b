'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AlertCircle, ArrowLeft, ImageIcon, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { useCart } from '@/lib/cart-store'
import { resolveBrandColor } from '@/lib/brand'
import { cn, formatCurrency } from '@/lib/utils'

interface ProductDetailsData {
  id: string
  name: string
  sku: string | null
  description: string | null
  image_url: string | null
  unit: string
  vat_rate: number
  min_order_qty: number
  order_multiple: number
  stock_status: string
  customer_price: number
  category_name: string | null
}

interface Props {
  brandColor: string
  backHref: string
  product: ProductDetailsData
}

export function ProductDetails({ brandColor, backHref, product }: Props) {
  const { addItem } = useCart()
  const resolvedBrandColor = resolveBrandColor(brandColor)
  const [qty, setQty] = useState(product.min_order_qty)
  const unavailable = product.stock_status === 'unavailable'
  const limited = product.stock_status === 'limited'

  function updateQty(delta: number) {
    setQty(current => Math.max(product.min_order_qty, Number((current + delta).toFixed(3))))
  }

  function handleAddToCart() {
    if (unavailable) {
      toast.error('Ten produkt jest niedostępny')
      return
    }

    addItem({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      imageUrl: product.image_url,
      unit: product.unit,
      price: product.customer_price,
      vatRate: product.vat_rate,
      qty,
      minQty: product.min_order_qty,
      multiple: product.order_multiple,
    })

    toast.success(`Dodano: ${product.name}`)
  }

  return (
    <div className="space-y-5">
      <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-slate-950">
        <ArrowLeft className="h-4 w-4" />
        Wróć do katalogu
      </Link>

      <section className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="premium-card overflow-hidden">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="aspect-[4/3] w-full object-cover" />
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
              <div className="rounded-lg bg-white/85 p-5 text-center shadow-sm">
                <ImageIcon className="mx-auto h-8 w-8 text-slate-400" />
                <div className="mt-3 text-sm font-bold text-slate-500">Brak zdjęcia produktu</div>
              </div>
            </div>
          )}
        </div>

        <article className={cn('premium-card p-5 md:p-6', unavailable && 'opacity-70')}>
          <div className="flex flex-wrap items-center gap-2">
            {product.category_name && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                {product.category_name}
              </span>
            )}
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-slate-400 ring-1 ring-slate-200">
              VAT {product.vat_rate}%
            </span>
          </div>

          <h1 className="mt-5 text-2xl font-black tracking-tight text-slate-950 md:text-4xl">
            {product.name}
          </h1>

          <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-slate-500">
            {product.sku && <span>SKU: {product.sku}</span>}
            <span>Jednostka: {product.unit}</span>
            <span>Minimum: {product.min_order_qty} {product.unit}</span>
          </div>

          {product.description && (
            <p className="mt-5 text-sm leading-7 text-slate-600">
              {product.description}
            </p>
          )}

          {limited && (
            <div className="mt-5 flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-bold text-orange-700">
              <AlertCircle className="h-4 w-4" />
              Ograniczona dostępność
            </div>
          )}
          {unavailable && (
            <div className="mt-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
              <AlertCircle className="h-4 w-4" />
              Produkt niedostępny
            </div>
          )}

          <div className="mt-6 rounded-lg bg-[#F8F5EF] p-3 sm:p-4">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Cena netto</div>
            <div className="mt-1 flex items-end justify-between gap-4">
              <div className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
                {formatCurrency(product.customer_price)}
              </div>
              <div className="text-sm font-bold text-slate-400">/ {product.unit}</div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex overflow-hidden rounded-lg border border-[#D9D5CC] bg-white">
              <button
                type="button"
                onClick={() => updateQty(-product.order_multiple)}
                className="px-3 py-2 text-sm font-black text-slate-600 transition hover:bg-slate-100 sm:px-4 sm:py-3"
                disabled={unavailable}
              >
                -
              </button>
              <input
                type="number"
                value={qty}
                min={product.min_order_qty}
                step={product.order_multiple}
                onChange={e => setQty(parseFloat(e.target.value) || product.min_order_qty)}
                className="w-16 border-x border-[#D9D5CC] py-2 text-center text-sm font-bold focus:outline-none sm:w-20 sm:py-3"
                disabled={unavailable}
              />
              <button
                type="button"
                onClick={() => updateQty(product.order_multiple)}
                className="px-3 py-2 text-sm font-black text-slate-600 transition hover:bg-slate-100 sm:px-4 sm:py-3"
                disabled={unavailable}
              >
                +
              </button>
            </div>
            <span className="text-xs font-bold text-slate-400">{product.unit}</span>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={unavailable}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-40 sm:flex-none"
              style={{ backgroundColor: resolvedBrandColor }}
            >
              <ShoppingCart className="h-4 w-4" />
              Dodaj do koszyka
            </button>
          </div>
        </article>
      </section>
    </div>
  )
}
