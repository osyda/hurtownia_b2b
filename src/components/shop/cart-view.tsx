'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart-store'
import { placeOrder } from '@/app/actions/place-order'
import { formatCurrency } from '@/lib/utils'
import { Trash2, ShoppingCart, CheckCircle, Info } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { CustomerAddress } from '@/types/database.types'

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
}

const DAYS = ['', 'Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Niedz']

export function CartView({ tenantSlug, brandColor, customerId, minOrderValue, addresses, paymentMethods, deliveryInfo, deliveryDays, cutoffTime }: Props) {
  const router = useRouter()
  const { items, updateQty, updateNotes, removeItem, clear, totalNet, totalGross } = useCart()
  const [pending, startTransition] = useTransition()
  const [submitted, setSubmitted] = useState(false)
  const [submittedOrder, setSubmittedOrder] = useState<{ id: string; number: string } | null>(null)

  // Checkout state
  const [deliveryDate, setDeliveryDate] = useState('')
  const [addressId, setAddressId] = useState(addresses.find(a => a.is_default)?.id ?? addresses[0]?.id ?? '')
  const [paymentMethodId, setPaymentMethodId] = useState(paymentMethods[0]?.id ?? '')
  const [notes, setNotes] = useState('')

  const net = totalNet()
  const gross = totalGross()
  const belowMin = minOrderValue > 0 && net < minOrderValue

  // Next available delivery dates
  function getNextDeliveryDates() {
    const dates: string[] = []
    const now = new Date()
    const [hh, mm] = cutoffTime.split(':').map(Number)
    const cutoff = new Date(now)
    cutoff.setHours(hh, mm, 0, 0)

    let d = new Date(now)
    if (now >= cutoff) d.setDate(d.getDate() + 1)

    while (dates.length < 7) {
      const dow = d.getDay() === 0 ? 7 : d.getDay()
      if (deliveryDays.includes(dow)) {
        dates.push(d.toISOString().slice(0, 10))
      }
      d.setDate(d.getDate() + 1)
    }
    return dates
  }

  const deliveryDates = getNextDeliveryDates()

  function handleSubmit() {
    if (!items.length) return
    if (belowMin) { toast.error(`Minimalna wartość zamówienia: ${formatCurrency(minOrderValue)}`); return }

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
        deliveryDate,
        deliveryAddressId: addressId || null,
        deliveryAddress,
        paymentMethodId: paymentMethodId || null,
        customerNotes: notes,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      clear()
      setSubmitted(true)
      setSubmittedOrder({ id: result.orderId!, number: result.orderNumber! })
    })
  }

  if (submitted && submittedOrder) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900">Zamówienie złożone!</h1>
        <p className="text-gray-500 mt-2">Nr zamówienia: <span className="font-mono font-bold text-gray-900">{submittedOrder.number}</span></p>
        <p className="text-sm text-gray-400 mt-1">Potwierdzenie zostanie wysłane na Twój e-mail</p>
        <div className="flex gap-3 mt-8 justify-center">
          <Link href={`/sklep/${tenantSlug}/zamowienia/${submittedOrder.id}`} className="px-4 py-2 rounded-lg text-white font-medium text-sm hover:opacity-90" style={{ backgroundColor: brandColor }}>
            Zobacz zamówienie
          </Link>
          <Link href={`/sklep/${tenantSlug}/katalog`} className="px-4 py-2 rounded-lg border text-gray-700 font-medium text-sm hover:bg-gray-50">
            Kontynuuj zakupy
          </Link>
        </div>
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <ShoppingCart className="h-16 w-16 text-gray-200 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900">Koszyk jest pusty</h1>
        <p className="text-gray-500 mt-2 text-sm">Dodaj produkty z katalogu</p>
        <Link href={`/sklep/${tenantSlug}/katalog`} className="inline-block mt-6 px-5 py-2.5 rounded-lg text-white font-medium text-sm hover:opacity-90" style={{ backgroundColor: brandColor }}>
          Przeglądaj produkty
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Pozycje koszyka */}
      <div className="lg:col-span-2 space-y-3">
        <h1 className="text-xl font-bold text-gray-900 mb-4">Koszyk ({items.length})</h1>

        {items.map(item => (
          <div key={item.productId} className="bg-white rounded-xl border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm">{item.name}</div>
                {item.sku && <div className="text-xs text-gray-400">SKU: {item.sku}</div>}
              </div>
              <button onClick={() => removeItem(item.productId)} className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button onClick={() => updateQty(item.productId, Math.max(item.minQty, item.qty - item.multiple))} className="px-2.5 py-1.5 text-gray-600 hover:bg-gray-100 text-sm font-medium">−</button>
                <span className="px-3 py-1.5 text-sm border-x border-gray-300 min-w-[3rem] text-center">{item.qty}</span>
                <button onClick={() => updateQty(item.productId, item.qty + item.multiple)} className="px-2.5 py-1.5 text-gray-600 hover:bg-gray-100 text-sm font-medium">+</button>
                <span className="px-2 text-xs text-gray-400">{item.unit}</span>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">{formatCurrency(item.price * item.qty)}</div>
                <div className="text-xs text-gray-400">{formatCurrency(item.price)} / {item.unit} netto</div>
              </div>
            </div>

            <div className="mt-2">
              <input
                type="text"
                value={item.notes}
                onChange={e => updateNotes(item.productId, e.target.value)}
                placeholder="Uwaga do tej pozycji (opcjonalnie)..."
                className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 text-gray-600"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Checkout */}
      <div className="space-y-4">
        {/* Podsumowanie */}
        <div className="bg-white rounded-xl border p-4 sticky top-24">
          <h2 className="font-semibold text-gray-900 mb-3">Podsumowanie</h2>

          <div className="space-y-1.5 text-sm mb-4">
            <div className="flex justify-between text-gray-500"><span>Netto:</span><span>{formatCurrency(net)}</span></div>
            <div className="flex justify-between text-gray-500"><span>VAT:</span><span>{formatCurrency(gross - net)}</span></div>
            <div className="flex justify-between font-bold text-gray-900 text-base border-t pt-2 mt-2"><span>Brutto:</span><span>{formatCurrency(gross)}</span></div>
          </div>

          {belowMin && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-2.5 mb-3 text-xs text-red-700">
              <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              Minimalna wartość zamówienia: {formatCurrency(minOrderValue)}
            </div>
          )}

          {/* Termin dostawy */}
          <div className="space-y-1 mb-3">
            <label className="block text-xs font-medium text-gray-700">Termin dostawy</label>
            <select value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Do ustalenia</option>
              {deliveryDates.map(d => {
                const date = new Date(d)
                const dow = date.getDay() === 0 ? 7 : date.getDay()
                return <option key={d} value={d}>{d} ({DAYS[dow]})</option>
              })}
            </select>
            {deliveryInfo && (
              <p className="text-xs text-gray-400">{deliveryInfo}</p>
            )}
          </div>

          {/* Adres dostawy */}
          {addresses.length > 0 && (
            <div className="space-y-1 mb-3">
              <label className="block text-xs font-medium text-gray-700">Adres dostawy</label>
              <select value={addressId} onChange={e => setAddressId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {addresses.map(a => (
                  <option key={a.id} value={a.id}>{a.label ? `${a.label} — ` : ''}{a.street}, {a.city}</option>
                ))}
              </select>
            </div>
          )}

          {/* Forma płatności */}
          {paymentMethods.length > 0 && (
            <div className="space-y-1 mb-3">
              <label className="block text-xs font-medium text-gray-700">Forma płatności</label>
              <select value={paymentMethodId} onChange={e => setPaymentMethodId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {paymentMethods.map(m => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Uwagi */}
          <div className="space-y-1 mb-4">
            <label className="block text-xs font-medium text-gray-700">Uwagi do zamówienia</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Opcjonalne uwagi..." />
          </div>

          <button
            onClick={handleSubmit}
            disabled={pending || belowMin || !items.length}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
            style={{ backgroundColor: brandColor }}
          >
            {pending ? 'Składanie zamówienia...' : 'Złóż zamówienie'}
          </button>
        </div>
      </div>
    </div>
  )
}
