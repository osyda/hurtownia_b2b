'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  productId: string
  name: string
  sku: string | null
  imageUrl?: string | null
  unit: string
  price: number   // unit price net (customer-specific)
  vatRate: number
  qty: number
  minQty: number
  multiple: number
  notes: string
}

interface CartStore {
  items: CartItem[]
  tenantSlug: string | null
  deliveryDate: string
  deliveryWindow: string
  setTenant: (slug: string) => void
  setDeliveryDate: (date: string) => void
  setDeliveryWindow: (window: string) => void
  addItem: (item: Omit<CartItem, 'notes'>) => void
  updateQty: (productId: string, qty: number) => void
  updateNotes: (productId: string, notes: string) => void
  removeItem: (productId: string) => void
  clear: () => void
  totalNet: () => number
  totalGross: () => number
  itemCount: () => number
}

function sanitizeQty(item: Pick<CartItem, 'minQty'>, qty: number) {
  const minQty = Number.isFinite(item.minQty) && item.minQty > 0 ? item.minQty : 1
  const safeQty = Number.isFinite(qty) ? qty : minQty
  return Number(Math.max(minQty, safeQty).toFixed(3))
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      tenantSlug: null,
      deliveryDate: '',
      deliveryWindow: '',

      setTenant: (slug) => {
        if (get().tenantSlug !== slug) set({ items: [], deliveryDate: '', deliveryWindow: '', tenantSlug: slug })
      },

      setDeliveryDate: (date) => set({ deliveryDate: date }),

      setDeliveryWindow: (window) => set({ deliveryWindow: window }),

      addItem: (newItem) => set((state) => {
        const existing = state.items.find(i => i.productId === newItem.productId)
        if (existing) {
          return {
            items: state.items.map(i =>
              i.productId === newItem.productId
                ? { ...i, qty: sanitizeQty(i, i.qty + newItem.qty) }
                : i
            ),
          }
        }
        return { items: [...state.items, { ...newItem, qty: sanitizeQty(newItem, newItem.qty), notes: '' }] }
      }),

      updateQty: (productId, qty) => set((state) => ({
        items: state.items.map(i => i.productId === productId ? { ...i, qty: sanitizeQty(i, qty) } : i),
      })),

      updateNotes: (productId, notes) => set((state) => ({
        items: state.items.map(i => i.productId === productId ? { ...i, notes } : i),
      })),

      removeItem: (productId) => set((state) => ({
        items: state.items.filter(i => i.productId !== productId),
      })),

      clear: () => set({ items: [] }),

      totalNet: () => {
        const items = get().items
        return Number(items.reduce((sum, i) => sum + i.price * i.qty, 0).toFixed(2))
      },

      totalGross: () => {
        const items = get().items
        return Number(items.reduce((sum, i) => sum + i.price * i.qty * (1 + i.vatRate / 100), 0).toFixed(2))
      },

      itemCount: () => Number(get().items.reduce((sum, i) => sum + i.qty, 0).toFixed(3)),
    }),
    {
      name: 'b2b-cart',
    }
  )
)
