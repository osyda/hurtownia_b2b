'use client'

import { useState, useTransition } from 'react'
import { updateOrderStatus, updateOrderNote, updateOrderItemQty } from '@/app/actions/orders'
import { OrderItem, OrderStatus } from '@/types/database.types'
import { Button } from '@/components/ui/button'
import { formatCurrency, ORDER_STATUS_LABELS } from '@/lib/utils'
import { toast } from 'sonner'
import { Check, ChevronDown } from 'lucide-react'

interface Order {
  id: string
  status: OrderStatus
  internal_notes: string | null
}

interface Props {
  tenantSlug: string
  order: Order
  items: OrderItem[]
}

const STATUS_FLOW: OrderStatus[] = ['new', 'accepted', 'in_progress', 'ready', 'delivered', 'cancelled']

export function OrderDetail({ tenantSlug, order, items }: Props) {
  const [pending, startTransition] = useTransition()
  const [note, setNote] = useState(order.internal_notes ?? '')
  const [qtys, setQtys] = useState<Record<string, string>>(() =>
    Object.fromEntries(items.map(i => [i.id, String(i.fulfilled_qty ?? i.ordered_qty)]))
  )

  function handleStatusChange(status: OrderStatus) {
    startTransition(async () => {
      const result = await updateOrderStatus(tenantSlug, order.id, status)
      if (result?.error) toast.error(result.error)
      else toast.success(`Status zmieniony na: ${ORDER_STATUS_LABELS[status]}`)
    })
  }

  function handleNoteSave() {
    startTransition(async () => {
      const result = await updateOrderNote(tenantSlug, order.id, note)
      if (result?.error) toast.error(result.error)
      else toast.success('Notatka zapisana')
    })
  }

  function handleQtySave(itemId: string) {
    const qty = parseFloat(qtys[itemId])
    if (isNaN(qty) || qty < 0) { toast.error('Nieprawidłowa ilość'); return }
    startTransition(async () => {
      const result = await updateOrderItemQty(tenantSlug, order.id, itemId, qty)
      if (result?.error) toast.error(result.error)
      else toast.success('Ilość zaktualizowana — wartość zamówienia przeliczona')
    })
  }

  return (
    <div className="space-y-6">
      {/* Pozycje zamówienia */}
      <div className="premium-card overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Pozycje zamówienia</h2>
          <span className="text-sm text-gray-400">{items.length} pozycji</span>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Produkt</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Zam. ilość</th>
              <th className="text-center text-xs font-medium text-gray-500 uppercase px-4 py-3">Realiz. ilość</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Cena netto</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Wartość netto</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map(item => {
              const hasChanged = qtys[item.id] !== String(item.fulfilled_qty ?? item.ordered_qty)
              return (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-sm text-gray-900">{item.product_name}</div>
                    {item.product_sku && <div className="text-xs text-gray-400">{item.product_sku}</div>}
                    {item.customer_notes && <div className="text-xs text-amber-600 mt-0.5">Uwaga: {item.customer_notes}</div>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 text-right">
                    {item.ordered_qty} {item.product_unit}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-center">
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        value={qtys[item.id]}
                        onChange={e => setQtys(prev => ({ ...prev, [item.id]: e.target.value }))}
                        className="w-24 px-2 py-1 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                      />
                      <span className="text-xs text-gray-400">{item.product_unit}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">{formatCurrency(item.unit_price_net)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">{formatCurrency(item.line_total_net)}</td>
                  <td className="px-4 py-3">
                    {hasChanged && (
                      <Button size="sm" onClick={() => handleQtySave(item.id)} loading={pending}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Zmiana statusu */}
      <div className="premium-card p-4">
        <h2 className="font-semibold text-gray-900 mb-3">Zmień status zamówienia</h2>
        <div className="flex flex-wrap gap-2">
          {STATUS_FLOW.map(s => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              disabled={pending || order.status === s}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 ${
                order.status === s
                  ? 'bg-blue-600 text-white cursor-default'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {ORDER_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Notatka wewnętrzna */}
      <div className="premium-card p-4">
        <h2 className="font-semibold text-gray-900 mb-3">Notatka wewnętrzna</h2>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/15 resize-none"
          placeholder="Notatka widoczna tylko dla hurtowni..."
        />
        <div className="flex justify-end mt-2">
          <Button size="sm" variant="secondary" onClick={handleNoteSave} loading={pending}>Zapisz notatkę</Button>
        </div>
      </div>
    </div>
  )
}
