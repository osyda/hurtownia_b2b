'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { updateTenantSettings, upsertDeliverySettings, createPaymentMethod, togglePaymentMethod, deletePaymentMethod } from '@/app/actions/settings'
import { Trash2, Plus } from 'lucide-react'

interface Tenant {
  id: string
  name: string
  slug: string
  brand_color: string
  contact_email: string | null
  contact_phone: string | null
}

interface DeliverySettings {
  id: string
  min_order_value: number
  delivery_days: number[]
  order_cutoff_time: string | null
  customer_info: string | null
}

interface PaymentMethod {
  id: string
  label: string
  type: string
  is_active: boolean
}

const DAY_NAMES = ['Niedz', 'Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob']
const PAYMENT_TYPES = [
  { value: 'cash', label: 'Gotówka' },
  { value: 'bank_transfer', label: 'Przelew' },
  { value: 'card', label: 'Karta' },
  { value: 'blik', label: 'BLIK' },
  { value: 'credit', label: 'Kredyt kupiecki' },
]

export function SettingsForm({
  tenantSlug,
  tenant,
  delivery,
  paymentMethods,
  isAdmin,
}: {
  tenantSlug: string
  tenant: Tenant | null
  delivery: DeliverySettings | null
  paymentMethods: PaymentMethod[]
  isAdmin: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [selectedDays, setSelectedDays] = useState<number[]>(delivery?.delivery_days ?? [])
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [brandColor, setBrandColor] = useState(tenant?.brand_color ?? '#2563eb')

  function handleTenantSubmit(formData: FormData) {
    formData.set('brand_color', brandColor)
    startTransition(async () => {
      const res = await updateTenantSettings(tenantSlug, formData)
      if (res?.error) toast.error(res.error)
      else toast.success('Ustawienia zapisane')
    })
  }

  function handleDeliverySubmit(formData: FormData) {
    formData.set('delivery_days', selectedDays.join(','))
    startTransition(async () => {
      const res = await upsertDeliverySettings(tenantSlug, formData)
      if (res?.error) toast.error(res.error)
      else toast.success('Ustawienia dostawy zapisane')
    })
  }

  function handleAddPayment(formData: FormData) {
    startTransition(async () => {
      const res = await createPaymentMethod(tenantSlug, formData)
      if (res?.error) toast.error(res.error)
      else {
        toast.success('Metoda płatności dodana')
        setShowAddPayment(false)
      }
    })
  }

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      const res = await togglePaymentMethod(tenantSlug, id, !current)
      if (res?.error) toast.error(res.error)
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Usunąć tę metodę płatności?')) return
    startTransition(async () => {
      const res = await deletePaymentMethod(tenantSlug, id)
      if (res?.error) toast.error(res.error)
      else toast.success('Metoda usunięta')
    })
  }

  const toggleDay = (d: number) =>
    setSelectedDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort())

  return (
    <div className="p-8 max-w-3xl">
      <PageHeader title="Ustawienia" description="Konfiguracja hurtowni i warunków dostaw" />

      {/* General settings */}
      <section className="bg-white rounded-xl border mb-6">
        <div className="p-5 border-b">
          <h2 className="font-semibold text-gray-900">Ogólne</h2>
        </div>
        <form action={handleTenantSubmit} className="p-5 space-y-4">
          <Input
            label="Nazwa hurtowni"
            name="name"
            defaultValue={tenant?.name ?? ''}
            required
            disabled={!isAdmin}
          />
          <Input
            label="E-mail kontaktowy (do powiadomień o zamówieniach)"
            name="contact_email"
            type="email"
            defaultValue={tenant?.contact_email ?? ''}
            disabled={!isAdmin}
          />
          <Input
            label="Telefon kontaktowy"
            name="contact_phone"
            defaultValue={tenant?.contact_phone ?? ''}
            disabled={!isAdmin}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kolor marki</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={brandColor}
                onChange={e => setBrandColor(e.target.value)}
                disabled={!isAdmin}
                className="h-10 w-16 rounded-lg border border-gray-300 cursor-pointer"
              />
              <span className="text-sm text-gray-500 font-mono">{brandColor}</span>
            </div>
          </div>
          {isAdmin && (
            <div className="pt-2">
              <Button type="submit" loading={isPending}>Zapisz</Button>
            </div>
          )}
        </form>
      </section>

      {/* Delivery settings */}
      <section className="bg-white rounded-xl border mb-6">
        <div className="p-5 border-b">
          <h2 className="font-semibold text-gray-900">Dostawa i zamówienia</h2>
        </div>
        <form action={handleDeliverySubmit} className="p-5 space-y-4">
          <Input
            label="Minimalna wartość zamówienia (zł netto)"
            name="min_order_value"
            type="number"
            step="0.01"
            min="0"
            defaultValue={delivery?.min_order_value ?? 0}
          />
          <Input
            label="Godzina graniczna zamówień (np. 14:00)"
            name="order_cutoff_time"
            type="time"
            defaultValue={delivery?.order_cutoff_time ?? ''}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dni dostaw</label>
            <div className="flex gap-2 flex-wrap">
              {DAY_NAMES.map((name, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedDays.includes(i)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Informacje dla klientów</label>
            <textarea
              name="customer_info"
              rows={2}
              defaultValue={delivery?.customer_info ?? ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Np. dostawa do magazynu, wejście od tyłu..."
            />
          </div>
          <div className="pt-2">
            <Button type="submit" loading={isPending}>Zapisz ustawienia dostaw</Button>
          </div>
        </form>
      </section>

      {/* Payment methods */}
      <section className="bg-white rounded-xl border">
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Metody płatności</h2>
          {isAdmin && (
            <Button size="sm" variant="secondary" onClick={() => setShowAddPayment(v => !v)}>
              <Plus className="h-4 w-4" />
              Dodaj
            </Button>
          )}
        </div>

        {showAddPayment && (
          <form action={handleAddPayment} className="p-5 border-b bg-gray-50">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Input label="Nazwa" name="label" placeholder="np. Przelew bankowy" required />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Typ</label>
                <select name="type" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  {PAYMENT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" loading={isPending}>Dodaj</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowAddPayment(false)}>Anuluj</Button>
            </div>
          </form>
        )}

        <div className="divide-y">
          {paymentMethods.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">
              Brak metod płatności — dodaj pierwszą
            </div>
          )}
          {paymentMethods.map(pm => (
            <div key={pm.id} className="p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-sm text-gray-900">{pm.label}</div>
                <div className="text-xs text-gray-400">
                  {PAYMENT_TYPES.find(t => t.value === pm.type)?.label}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleToggle(pm.id, pm.is_active)}
                  disabled={isPending}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    pm.is_active ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                    pm.is_active ? 'translate-x-4.5' : 'translate-x-0.5'
                  }`} />
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleDelete(pm.id)}
                    disabled={isPending}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
