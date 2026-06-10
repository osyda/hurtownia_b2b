'use client'

import Link from 'next/link'
import { ArrowRight, ShoppingCart, Trash2 } from 'lucide-react'
import { useCart } from '@/lib/cart-store'
import { resolveBrandColor } from '@/lib/brand'
import { formatCurrency } from '@/lib/utils'
import { CartQuantityControl } from './cart-quantity-control'

interface QuickCartPanelProps {
  brandColor: string
  shopBasePath: string
}

function formatQty(value: number) {
  return Number(value.toFixed(3)).toString()
}

export function QuickCartPanel({ brandColor, shopBasePath }: QuickCartPanelProps) {
  const { items, updateQty, removeItem, totalNet, totalGross, itemCount } = useCart()
  const resolvedBrandColor = resolveBrandColor(brandColor)
  const net = totalNet()
  const gross = totalGross()
  const count = itemCount()

  return (
    <aside className="hidden lg:block">
      <div className="premium-card sticky top-24 overflow-hidden bg-white/95">
        <div className="border-b border-[#E2DCD0] bg-[#F8F5EF] px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0F5B41]">Koszyk</div>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">Szybkie zamówienie</h2>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-slate-950 shadow-sm">
              <ShoppingCart className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-500">
            {items.length ? `${items.length} pozycji / ${formatQty(count)} szt.` : 'Dodawaj produkty bez przechodzenia do koszyka.'}
          </p>
        </div>

        {!items.length ? (
          <div className="p-4">
            <div className="rounded-xl border border-dashed border-[#D9D5CC] bg-white p-4 text-sm font-semibold leading-6 text-slate-500">
              Koszyk jest pusty. Kliknij „Dodaj” przy produkcie, a podsumowanie pojawi się tutaj od razu.
            </div>
          </div>
        ) : (
          <>
            <div className="max-h-[calc(100vh-27rem)] space-y-3 overflow-y-auto p-4">
              {items.map(item => (
                <div key={item.productId} className="rounded-xl border border-[#E2DCD0] bg-white p-3 shadow-sm">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900">{item.name}</div>
                      <div className="mt-1 flex items-center justify-between gap-2 text-[11px] font-semibold text-slate-400">
                        <span className="truncate">{item.sku ? `SKU: ${item.sku}` : 'Produkt'}</span>
                        <span>{formatCurrency(item.price)} / {item.unit}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg text-slate-300 transition hover:bg-red-50 hover:text-red-500"
                      aria-label="Usuń produkt z koszyka"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <CartQuantityControl
                      value={item.qty}
                      min={item.minQty}
                      step={item.multiple}
                      unit={item.unit}
                      size="sm"
                      onChange={qty => updateQty(item.productId, qty)}
                    />
                    <div className="text-right">
                      <div className="text-sm font-semibold text-slate-900">{formatCurrency(item.price * item.qty)}</div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">netto</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-[#E2DCD0] bg-white p-4">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-500">
                  <span>Netto</span>
                  <span className="font-bold text-slate-700">{formatCurrency(net)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Brutto</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(gross)}</span>
                </div>
              </div>
              <Link
                href={`${shopBasePath}/koszyk`}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 active:scale-95"
                style={{ backgroundColor: resolvedBrandColor }}
              >
                Przejdź do zamówienia
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        )}
      </div>
    </aside>
  )
}
