'use client'

import { useCart } from '@/lib/cart-store'
import { useRouter } from 'next/navigation'
import { RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { resolveBrandColor } from '@/lib/brand'

interface OrderItem {
  product_id: string | null
  product_name: string
  product_sku: string | null
  product_unit: string
  ordered_qty: number
  unit_price_net: number
  vat_rate: number
  line_total_net: number
}

interface Props {
  brandColor: string
  items: OrderItem[]
  shopBasePath: string
}

export function ReorderButton({ brandColor, items, shopBasePath }: Props) {
  const { addItem, clear } = useCart()
  const router = useRouter()
  const resolvedBrandColor = resolveBrandColor(brandColor)

  function handleReorder() {
    clear()
    for (const item of items) {
      if (!item.product_id) continue
      addItem({
        productId: item.product_id,
        name: item.product_name,
        sku: item.product_sku,
        unit: item.product_unit,
        price: item.unit_price_net,
        vatRate: item.vat_rate,
        qty: item.ordered_qty,
        minQty: 1,
        multiple: 1,
      })
    }
    toast.success('Produkty dodane do koszyka')
    router.push(`${shopBasePath}/koszyk`)
  }

  return (
    <button
      onClick={handleReorder}
      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-opacity"
      style={{ backgroundColor: resolvedBrandColor }}
    >
      <RotateCcw className="h-4 w-4" />
      Zamów ponownie
    </button>
  )
}
