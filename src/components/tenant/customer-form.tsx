'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Customer, PaymentMethod, PriceGroup } from '@/types/database.types'

interface Props {
  tenantSlug: string
  priceGroups: PriceGroup[]
  paymentMethods: PaymentMethod[]
  selectedPaymentMethodIds?: string[]
  customer?: Customer
  onSubmit: (formData: FormData) => Promise<{ error?: string } | void>
}

export function CustomerForm({
  tenantSlug,
  priceGroups,
  paymentMethods,
  selectedPaymentMethodIds = [],
  customer,
  onSubmit,
}: Props) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const addr = customer?.invoice_address as { street?: string; city?: string; postal_code?: string } | null
  const selectedPayments = new Set(selectedPaymentMethodIds)

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await onSubmit(formData)
      if (result?.error) toast.error(result.error)
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="premium-card p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Dane firmy</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Nazwa firmy" name="company_name" defaultValue={customer?.company_name} required placeholder="np. Restauracja Pod Lipą Sp. z o.o." />
          <Input label="NIP" name="nip" defaultValue={customer?.nip ?? ''} placeholder="000-000-00-00" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="E-mail" name="email" type="email" defaultValue={customer?.email} required placeholder="zamowienia@firma.pl" />
          <Input label="Telefon" name="phone" defaultValue={customer?.phone ?? ''} placeholder="+48 000 000 000" />
        </div>
      </div>

      <div className="premium-card p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Adres do faktury</h2>
        <Input label="Ulica i numer" name="invoice_street" defaultValue={addr?.street ?? ''} placeholder="ul. Przykładowa 1" />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Kod pocztowy" name="invoice_postal_code" defaultValue={addr?.postal_code ?? ''} placeholder="00-000" />
          <Input label="Miasto" name="invoice_city" defaultValue={addr?.city ?? ''} placeholder="Warszawa" />
        </div>
      </div>

      <div className="premium-card p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Warunki handlowe</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Grupa cenowa"
            name="price_group_id"
            defaultValue={customer?.price_group_id ?? ''}
            placeholder="Ceny bazowe"
            options={priceGroups.map(pg => ({ value: pg.id, label: pg.name }))}
          />
          <Input label="Min. wartość zamówienia (zł)" name="min_order_value" type="number" step="0.01" min="0" defaultValue={String(customer?.min_order_value ?? 0)} />
        </div>
        <Select
          label="Status"
          name="status"
          defaultValue={customer?.status ?? 'active'}
          options={[
            { value: 'active', label: 'Aktywny' },
            { value: 'pending', label: 'Oczekujący' },
            { value: 'inactive', label: 'Nieaktywny' },
          ]}
        />
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Notatki wewnętrzne</label>
          <textarea name="internal_notes" defaultValue={customer?.internal_notes ?? ''} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/15 resize-none" placeholder="Tylko do wglądu dla hurtowni..." />
        </div>
      </div>

      <div className="premium-card p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900">Formy płatności dla klienta</h2>
          <p className="mt-1 text-sm text-gray-500">
            Zaznaczone formy pojawią się klientowi przy składaniu zamówienia.
          </p>
        </div>

        {paymentMethods.length === 0 ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-800">
            Brak metod płatności w ustawieniach hurtowni. Dodaj je w sekcji Ustawienia, a potem przypisz klientowi.
          </div>
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {paymentMethods.map(method => (
              <label
                key={method.id}
                className={`flex items-start gap-3 rounded-lg border p-3 text-sm transition ${
                  method.is_active
                    ? 'cursor-pointer border-slate-200 bg-white hover:bg-slate-50'
                    : 'cursor-not-allowed border-slate-100 bg-slate-50 opacity-60'
                }`}
              >
                <input
                  type="checkbox"
                  name="payment_method_ids"
                  value={method.id}
                  defaultChecked={selectedPayments.has(method.id)}
                  disabled={!method.is_active}
                  className="mt-0.5"
                />
                <span>
                  <span className="block font-semibold text-gray-900">{method.label}</span>
                  <span className="text-xs text-gray-500">
                    {method.is_active ? 'Aktywna' : 'Nieaktywna'}
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button type="button" variant="secondary" onClick={() => router.back()}>Anuluj</Button>
        <Button type="submit" loading={pending}>{customer ? 'Zapisz zmiany' : 'Dodaj klienta'}</Button>
      </div>
    </form>
  )
}
