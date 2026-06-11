'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart-store'
import { placeOrder } from '@/app/actions/place-order'
import { resolveBrandColor } from '@/lib/brand'
import { formatCurrency } from '@/lib/utils'
import { DELIVERY_DAY_LABELS, DELIVERY_WINDOWS, getNextDeliveryDates, isPastDeliveryDate } from '@/lib/delivery'
import { CheckCircle, ImageIcon, Info, ShoppingCart, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { CustomerAddress } from '@/types/database.types'
import { CartQuantityControl } from './cart-quantity-control'

interface PaymentMethod { id: string; label: string; type: string }

interface Props {
  tenantSlug: string
  brandColor: string
  customerId: string
  minOrderValue: number
  addresses: CustomerAddress[]
  paymentMethods: PaymentMethod[]
  deliveryInfo: string | null
  deliveryDays: number[]
  cutoffTime: string
  shopBasePath: string
}

export function CartView({
  tenantSlug,
  brandColor,
  customerId,
  minOrderValue,
  addresses,
  paymentMethods,
  deliveryInfo,
  deliveryDays,
  cutoffTime,
  shopBasePath,
}: Props) {
  const router = useRouter()
  const {
    items,
    updateQty,
    updateNotes,
    removeItem,
    clear,
    totalNet,
    totalGross,
    deliveryDate,
    deliveryWindow,
    setDeliveryDate,
    setDeliveryWindow,
  } = useCart()
  const resolvedBrandColor = resolveBrandColor(brandColor)
  const [pending, startTransition] = useTransition()
  const [submitted, setSubmitted] = useState(false)
  const [submittedOrder, setSubmittedOrder] = useState<{ id: string; number: string } | null>(null)

  const [addressId, setAddressId] = useState(addresses.find(a => a.is_default)?.id ?? addresses[0]?.id ?? '')
  const [paymentMethodId, setPaymentMethodId] = useState(paymentMethods[0]?.id ?? '')
  const [notes, setNotes] = useState('')

  const net = totalNet()
  const gross = totalGross()
  const belowMin = minOrderValue > 0 && net < minOrderValue
  const minimumMissing = Math.max(0, minOrderValue - net)
  const minimumProgress = minOrderValue > 0 ? Math.min(100, (net / minOrderValue) * 100) : 0
  const noPaymentMethods = paymentMethods.length === 0
  const paymentMissing = !noPaymentMethods && !paymentMethodId

  const deliveryDates = getNextDeliveryDates(deliveryDays, cutoffTime)
  const selectedDeliveryDate = deliveryDate || deliveryDates[0] || ''
  const selectedDeliveryWindow = deliveryWindow || DELIVERY_WINDOWS[1]

  useEffect(() => {
    if (items.length && !deliveryDate && selectedDeliveryDate) setDeliveryDate(selectedDeliveryDate)
    if (items.length && !deliveryWindow) setDeliveryWindow(selectedDeliveryWindow)
  }, [deliveryDate, deliveryWindow, items.length, selectedDeliveryDate, selectedDeliveryWindow, setDeliveryDate, setDeliveryWindow])

  function handleSubmit() {
    if (!items.length) return
    if (belowMin) {
      toast.error(`Minimalna wartość zamówienia: ${formatCurrency(minOrderValue)}`)
      return
    }
    if (noPaymentMethods) {
      toast.error('Brak przypisanej formy płatności. Skontaktuj się z hurtownią.')
      return
    }
    if (!paymentMethodId) {
      toast.error('Wybierz formę płatności.')
      return
    }
    if (isPastDeliveryDate(selectedDeliveryDate)) {
      toast.error('Nie można wybrać daty dostawy z przeszłości.')
      return
    }

    const selectedAddress = addresses.find(a => a.id === addressId)
    const deliveryAddress = selectedAddress ? {
      street: selectedAddress.street,
      city: selectedAddress.city,
      postal_code: selectedAddress.postal_code,
      country: selectedAddress.country,
    } : null

    startTransition(async () => {
      const result = await placeOrder({
        tenantSlug,
        customerId,
        items,
        deliveryDate: selectedDeliveryDate,
        deliveryWindow: selectedDeliveryWindow,
        deliveryAddressId: addressId || null,
        deliveryAddress,
        paymentMethodId,
        customerNotes: notes,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      clear()
      setSubmitted(true)
      setSubmittedOrder({ id: result.orderId!, number: result.orderNumber! })
      router.refresh()
    })
  }

  if (submitted && submittedOrder) {
    return (
      <div className="premium-card mx-auto mt-16 max-w-md p-8 text-center">
        <CheckCircle className="mx-auto mb-4 h-16 w-16 text-emerald-500" />
        <h1 className="text-2xl font-black text-gray-900">Zamówienie złożone</h1>
        <p className="mt-2 text-gray-500">
          Nr zamówienia: <span className="font-mono font-black text-gray-900">{submittedOrder.number}</span>
        </p>
        <p className="mt-1 text-sm text-gray-400">Potwierdzenie zostanie wysłane na Twój e-mail.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href={`${shopBasePath}/zamowienia/${submittedOrder.id}`} className="rounded-lg px-4 py-2 text-sm font-bold text-white hover:opacity-90" style={{ backgroundColor: resolvedBrandColor }}>
            Zobacz zamówienie
          </Link>
          <Link href={`${shopBasePath}/katalog`} className="rounded-lg border px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">
            Kontynuuj zakupy
          </Link>
        </div>
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className="premium-card mx-auto mt-16 max-w-md p-8 text-center">
        <ShoppingCart className="mx-auto mb-4 h-16 w-16 text-gray-200" />
        <h1 className="text-xl font-black text-gray-900">Koszyk jest pusty</h1>
        <p className="mt-2 text-sm text-gray-500">Dodaj produkty z katalogu.</p>
        <Link href={`${shopBasePath}/katalog`} className="mt-6 inline-block rounded-lg px-5 py-2.5 text-sm font-bold text-white hover:opacity-90" style={{ backgroundColor: resolvedBrandColor }}>
          Przeglądaj produkty
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        <h1 className="mb-4 text-xl font-black text-gray-900">Koszyk ({items.length})</h1>

        {items.map(item => (
          <div key={item.productId} className="premium-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-[#E7E1D6] bg-[#F8F5EF]">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <ImageIcon className="h-5 w-5 text-slate-300" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-gray-900">{item.name}</div>
                  {item.sku && <div className="text-xs text-gray-400">SKU: {item.sku}</div>}
                </div>
              </div>
              <button type="button" onClick={() => removeItem(item.productId)} className="flex-shrink-0 text-gray-300 transition-colors hover:text-red-500" aria-label="Usuń produkt">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <CartQuantityControl
                value={item.qty}
                min={item.minQty}
                step={item.multiple}
                unit={item.unit}
                onChange={qty => updateQty(item.productId, qty)}
              />
              <div className="text-right">
                <div className="font-bold text-gray-900">{formatCurrency(item.price * item.qty)}</div>
                <div className="text-xs text-gray-400">{formatCurrency(item.price)} / {item.unit} netto</div>
              </div>
            </div>

            <input
              type="text"
              value={item.notes}
              onChange={e => updateNotes(item.productId, e.target.value)}
              placeholder="Uwaga do tej pozycji (opcjonalnie)..."
              className="mt-2 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-600 transition focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="premium-card sticky top-24 p-4">
          <h2 className="mb-3 font-black text-gray-900">Podsumowanie</h2>

          <div className="mb-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-500"><span>Netto:</span><span>{formatCurrency(net)}</span></div>
            <div className="flex justify-between text-gray-500"><span>VAT:</span><span>{formatCurrency(gross - net)}</span></div>
            <div className="mt-2 flex justify-between border-t pt-2 text-base font-black text-gray-900"><span>Brutto:</span><span>{formatCurrency(gross)}</span></div>
          </div>

          {minOrderValue > 0 && (
            <div className="mb-3 rounded-lg border border-[#E2DCD0] bg-[#FBF8F3] p-3">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3 text-xs font-bold text-gray-700">
                    <span>Minimum logistyczne</span>
                    <span>{formatCurrency(minOrderValue)}</span>
                  </div>
                  <p className={`mt-1 text-xs font-medium ${belowMin ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {belowMin ? `Brakuje ${formatCurrency(minimumMissing)} do złożenia zamówienia.` : 'Minimum osiągnięte. Możesz złożyć zamówienie.'}
                  </p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${minimumProgress}%`,
                        backgroundColor: belowMin ? '#D97706' : resolvedBrandColor,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mb-3 space-y-1">
            <label className="block text-xs font-bold text-gray-700">Termin dostawy</label>
            <select value={selectedDeliveryDate} onChange={e => setDeliveryDate(e.target.value)} className="premium-input w-full">
              {deliveryDates.map(d => {
                const date = new Date(d)
                const dow = date.getDay() === 0 ? 7 : date.getDay()
                return <option key={d} value={d}>{d} ({DELIVERY_DAY_LABELS[dow]})</option>
              })}
            </select>
            {deliveryInfo && <p className="text-xs text-gray-400">{deliveryInfo}</p>}
          </div>

          <div className="mb-3 space-y-1">
            <label className="block text-xs font-bold text-gray-700">Okno dostawy</label>
            <select value={selectedDeliveryWindow} onChange={e => setDeliveryWindow(e.target.value)} className="premium-input w-full">
              {DELIVERY_WINDOWS.map(window => <option key={window} value={window}>{window}</option>)}
            </select>
          </div>

          {addresses.length > 0 && (
            <div className="mb-3 space-y-1">
              <label className="block text-xs font-bold text-gray-700">Adres dostawy</label>
              <select value={addressId} onChange={e => setAddressId(e.target.value)} className="premium-input w-full">
                {addresses.map(a => (
                  <option key={a.id} value={a.id}>{a.label ? `${a.label} - ` : ''}{a.street}, {a.city}</option>
                ))}
              </select>
            </div>
          )}

          <div className="mb-3 space-y-2">
            <label className="block text-xs font-bold text-gray-700">Forma płatności *</label>
            {noPaymentMethods ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-800">
                Nie masz przypisanej formy płatności. Hurtownia musi przypisać ją w panelu klienta.
              </div>
            ) : (
              <div className="space-y-2">
                {paymentMethods.map(method => (
                  <label
                    key={method.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm font-bold transition ${
                      paymentMethodId === method.id ? 'border-[#1D2125] bg-[#F4F1EC] text-slate-950' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value={method.id}
                      checked={paymentMethodId === method.id}
                      onChange={() => setPaymentMethodId(method.id)}
                    />
                    {method.label}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="mb-4 space-y-1">
            <label className="block text-xs font-bold text-gray-700">Uwagi do zamówienia</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="premium-input w-full resize-none" placeholder="Opcjonalne uwagi..." />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={pending || belowMin || !items.length || noPaymentMethods || paymentMissing}
            className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-black text-white shadow-sm transition-all hover:opacity-90 disabled:opacity-40"
            style={{ backgroundColor: resolvedBrandColor }}
          >
            {pending ? 'Składanie zamówienia...' : 'Złóż zamówienie'}
          </button>
        </div>
      </div>
    </div>
  )
}
