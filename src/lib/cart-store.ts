'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  productId: string
  name: string
  sku: string | null
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
  setTenant: (slug: string) => void
  addItem: (item: Omit<CartItem, 'notes'>) => void
  updateQty: (productId: string, qty: number) => void
  updateNotes: (productId: string, notes: string) => void
  removeItem: (productId: string) => void
  clear: () => void
  totalNet: () => number
  totalGross: () => number
  itemCount: () => number
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      tenantSlug: null,

      setTenant: (slug) => {
        if (get().tenantSlug !== slug) set({ items: [], tenantSlug: slug })
      },

      addItem: (newItem) => set((state) => {
        const existing = state.items.find(i => i.productId === newItem.productId)
        if (existing) {
          return {
            items: state.items.map(i =>
              i.productId === newItem.productId
                ? { ...i, qty: i.qty + newItem.qty }
                : i
            ),
          }
        }
        return { items: [...state.items, { ...newItem, notes: '' }] }
      }),

      updateQty: (productId, qty) => set((state) => ({
        items: state.items.map(i => i.productId === productId ? { ...i, qty } : i),
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

      itemCount: () => get().items.reduce((sum, i) => sum + i.qty, 0),
    }),
    {
      name: 'b2b-cart',
    }
  )
)
