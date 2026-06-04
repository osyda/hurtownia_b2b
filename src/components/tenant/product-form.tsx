'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Category, Product } from '@/types/database.types'

interface Props {
  tenantSlug: string
  categories: Category[]
  product?: Product
  onSubmit: (formData: FormData) => Promise<{ error?: string } | void>
}

const UNITS = ['kg', 'szt.', 'opak.', 'karton', 'litr', 'para', 'zestaw']
const VAT_RATES = ['0', '5', '8', '23']

export function ProductForm({ tenantSlug, categories, product, onSubmit }: Props) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await onSubmit(formData)
      if (result?.error) toast.error(result.error)
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Podstawowe informacje</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Nazwa produktu" name="name" defaultValue={product?.name} required placeholder="np. Schab wieprzowy" />
          <Input label="SKU / Kod produktu" name="sku" defaultValue={product?.sku ?? ''} placeholder="np. SCH-001" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Kategoria"
            name="category_id"
            defaultValue={product?.category_id ?? ''}
            placeholder="Brak kategorii"
            options={categories.map(c => ({ value: c.id, label: c.name }))}
          />
          <Select
            label="Jednostka"
            name="unit"
            defaultValue={product?.unit ?? 'kg'}
            options={UNITS.map(u => ({ value: u, label: u }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Opis</label>
          <textarea
            name="description"
            defaultValue={product?.description ?? ''}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Opcjonalny opis produktu..."
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Cena i VAT</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Cena bazowa netto (zł)" name="base_price" type="number" step="0.01" min="0" defaultValue={product?.base_price ?? '0'} required />
          <Select label="Stawka VAT (%)" name="vat_rate" defaultValue={String(product?.vat_rate ?? '23')} options={VAT_RATES.map(v => ({ value: v, label: `${v}%` }))} />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Min. ilość zamówienia</label>
            <input name="min_order_qty" type="number" step="0.001" min="0" defaultValue={product?.min_order_qty ?? '1'} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Wielokrotność zamówienia</label>
            <input name="order_multiple" type="number" step="0.001" min="0" defaultValue={product?.order_multiple ?? '1'} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Dostępność i status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Stan magazynowy"
            name="stock_status"
            defaultValue={product?.stock_status ?? 'available'}
            options={[
              { value: 'available', label: 'Dostępny' },
              { value: 'limited', label: 'Ograniczona dostępność' },
              { value: 'unavailable', label: 'Niedostępny' },
            ]}
          />
          <Select
            label="Status produktu"
            name="status"
            defaultValue={product?.status ?? 'active'}
            options={[
              { value: 'active', label: 'Aktywny (widoczny dla klientów)' },
              { value: 'inactive', label: 'Nieaktywny (ukryty)' },
            ]}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Anuluj
        </Button>
        <Button type="submit" loading={pending}>
          {product ? 'Zapisz zmiany' : 'Dodaj produkt'}
        </Button>
      </div>
    </form>
  )
}
