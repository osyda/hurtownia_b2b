'use client'

import { useCart } from '@/lib/cart-store'
import { useRouter } from 'next/navigation'
import { RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { resolveBrandColor } from '@/lib/brand'
import { cn } from '@/lib/utils'

interface ReorderProduct {
  id: string
  name: string
  sku: string | null
  unit: string
  base_price: number
  vat_rate: number
  min_order_qty: number
  order_multiple: number
  stock_status: string
  status: string
}

export interface ReorderOrderItem {
  product_id: string | null
  product_name: string
  product_sku: string | null
  product_unit: string
  ordered_qty: number
  unit_price_net: number
  vat_rate: number
  line_total_net: number
  products?: ReorderProduct | ReorderProduct[] | null
}

interface Props {
  brandColor: string
  items: ReorderOrderItem[]
  shopBasePath: string
  variant?: 'full' | 'compact'
}

function getProduct(item: ReorderOrderItem) {
  if (Array.isArray(item.products)) return item.products[0] ?? null
  return item.products ?? null
}

export function ReorderButton({ brandColor, items, shopBasePath, variant = 'full' }: Props) {
  const { addItem, clear } = useCart()
  const router = useRouter()
  const resolvedBrandColor = resolveBrandColor(brandColor)

  function handleReorder() {
    const availableItems = items.filter(item => {
      const product = getProduct(item)
      return item.product_id && product && product.status === 'active' && product.stock_status !== 'unavailable'
    })
    const skippedItems = items.filter(item => !availableItems.includes(item))

    if (!availableItems.length) {
      toast.error('Nie można powtórzyć zamówienia, bo wszystkie produkty są niedostępne.')
      return
    }

    clear()
    for (const item of availableItems) {
      const product = getProduct(item)!
      addItem({
        productId: product.id,
        name: product.name,
        sku: product.sku,
        unit: product.unit,
        price: Number(item.unit_price_net),
        vatRate: Number(product.vat_rate),
        qty: item.ordered_qty,
        minQty: Number(product.min_order_qty) || 1,
        multiple: Number(product.order_multiple) || 1,
      })
    }

    toast.success(`Odtworzono koszyk: ${availableItems.length} pozycji`)
    if (skippedItems.length) {
      const names = skippedItems.map(item => item.product_name).join(', ')
      toast.warning(`Pominięto niedostępne pozycje: ${names}`)
    }

    router.push(`${shopBasePath}/koszyk`)
  }

  return (
    <button
      onClick={handleReorder}
      className={cn(
        'flex items-center justify-center gap-2 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity',
        variant === 'compact'
          ? 'px-3 py-2 text-xs'
          : 'w-full py-3 text-sm'
      )}
      style={{ backgroundColor: resolvedBrandColor }}
    >
      <RotateCcw className="h-4 w-4" />
      {variant === 'compact' ? 'Powtórz' : 'Zamów ponownie'}
    </button>
  )
}
