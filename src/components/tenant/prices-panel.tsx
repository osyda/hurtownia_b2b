'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import {
  createPriceGroup, updatePriceGroup, deletePriceGroup,
  assignCustomerToGroup, upsertProductPrice,
} from '@/app/actions/prices'
import { Plus, Trash2, Edit2, Check, X, Users, Tag } from 'lucide-react'

interface PriceGroup { id: string; name: string; description: string | null }
interface Customer { id: string; company_name: string; price_group_id: string | null }
interface Product { id: string; name: string; sku: string | null; base_price: number; unit: string }

type Tab = 'groups' | 'customers'

export function PricesPanel({
  tenantSlug,
  groups,
  customers,
  products,
}: {
  tenantSlug: string
  groups: PriceGroup[]
  customers: Customer[]
  products: Product[]
}) {
  const [tab, setTab] = useState<Tab>('groups')
  const [isPending, startTransition] = useTransition()
  const [editingGroup, setEditingGroup] = useState<string | null>(null)
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)
  const [priceEdits, setPriceEdits] = useState<Record<string, string>>({})

  function handleCreateGroup(formData: FormData) {
    startTransition(async () => {
      const res = await createPriceGroup(tenantSlug, formData)
      if (res?.error) toast.error(res.error)
      else { toast.success('Grupa cenowa dodana'); setShowNewGroup(false) }
    })
  }

  function handleUpdateGroup(groupId: string, formData: FormData) {
    startTransition(async () => {
      const res = await updatePriceGroup(tenantSlug, groupId, formData)
      if (res?.error) toast.error(res.error)
      else { toast.success('Zapisano'); setEditingGroup(null) }
    })
  }

  function handleDeleteGroup(groupId: string) {
    if (!confirm('Usunąć grupę cenową?')) return
    startTransition(async () => {
      const res = await deletePriceGroup(tenantSlug, groupId)
      if (res?.error) toast.error(res.error)
      else toast.success('Usunięto')
    })
  }

  function handleAssignGroup(customerId: string, groupId: string | null) {
    startTransition(async () => {
      const res = await assignCustomerToGroup(tenantSlug, customerId, groupId)
      if (res?.error) toast.error(res.error)
      else toast.success('Przypisano grupę')
    })
  }

  function handlePriceSave(productId: string, customerId: string) {
    const val = priceEdits[productId]
    const price = val === '' ? null : parseFloat(val)
    if (val !== '' && (isNaN(price!) || price! < 0)) {
      toast.error('Nieprawidłowa cena')
      return
    }
    startTransition(async () => {
      const res = await upsertProductPrice(tenantSlug, productId, customerId, null, price)
      if (res?.error) toast.error(res.error)
      else {
        toast.success(price === null ? 'Cena zresetowana' : 'Cena zapisana')
        setPriceEdits(prev => { const n = { ...prev }; delete n[productId]; return n })
      }
    })
  }

  const selectedCustomerData = customers.find(c => c.id === selectedCustomer)

  return (
    <div className="p-8">
      <PageHeader title="Cenniki" description="Grupy cenowe i indywidualne ceny dla klientów" />

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('groups')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'groups' ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Tag className="h-4 w-4" />
          Grupy cenowe
        </button>
        <button
          onClick={() => setTab('customers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'customers' ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Users className="h-4 w-4" />
          Ceny indywidualne
        </button>
      </div>

      {/* GROUPS TAB */}
      {tab === 'groups' && (
        <div className="bg-white rounded-xl border">
          <div className="p-5 border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Grupy cenowe</h2>
            <Button size="sm" variant="secondary" onClick={() => setShowNewGroup(v => !v)}>
              <Plus className="h-4 w-4" />
              Nowa grupa
            </Button>
          </div>

          {showNewGroup && (
            <form action={handleCreateGroup} className="p-5 border-b bg-gray-50">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <Input label="Nazwa grupy" name="name" required />
                <Input label="Opis (opcjonalnie)" name="description" />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" loading={isPending}>Utwórz</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setShowNewGroup(false)}>Anuluj</Button>
              </div>
            </form>
          )}

          <div className="divide-y">
            {groups.length === 0 && (
              <div className="p-8 text-center text-gray-400 text-sm">
                Brak grup cenowych — utwórz pierwszą
              </div>
            )}
            {groups.map(group => (
              <div key={group.id}>
                {editingGroup === group.id ? (
                  <form
                    action={(fd) => handleUpdateGroup(group.id, fd)}
                    className="p-4 grid grid-cols-2 gap-3 bg-blue-50"
                  >
                    <Input name="name" defaultValue={group.name} required label="Nazwa" />
                    <Input name="description" defaultValue={group.description ?? ''} label="Opis" />
                    <div className="col-span-3 flex gap-2">
                      <Button type="submit" size="sm" loading={isPending}>
                        <Check className="h-4 w-4" />
                        Zapisz
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setEditingGroup(null)}>
                        <X className="h-4 w-4" />
                        Anuluj
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm text-gray-900">{group.name}</div>
                      <div className="text-xs text-gray-400">
                        {group.description ?? 'Brak opisu'}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {customers.filter(c => c.price_group_id === group.id).length} klientów
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingGroup(group.id)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        disabled={isPending}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INDIVIDUAL PRICES TAB */}
      {tab === 'customers' && (
        <div className="grid grid-cols-3 gap-6">
          {/* Customer list */}
          <div className="bg-white rounded-xl border h-fit">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-sm text-gray-900">Wybierz klienta</h3>
            </div>
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {customers.length === 0 && (
                <div className="p-6 text-center text-gray-400 text-sm">Brak klientów</div>
              )}
              {customers.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setSelectedCustomer(c.id); setPriceEdits({}) }}
                  className={`w-full text-left p-3 hover:bg-gray-50 transition-colors ${
                    selectedCustomer === c.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900">{c.company_name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {c.price_group_id
                      ? `Grupa: ${groups.find(g => g.id === c.price_group_id)?.name ?? '?'}`
                      : 'Brak grupy'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Prices for selected customer */}
          <div className="col-span-2">
            {!selectedCustomer ? (
              <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
                Wybierz klienta z listy
              </div>
            ) : (
              <div className="bg-white rounded-xl border">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{selectedCustomerData?.company_name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Grupa cenowa:</span>
                      <select
                        value={selectedCustomerData?.price_group_id ?? ''}
                        onChange={e => handleAssignGroup(selectedCustomer, e.target.value || null)}
                        disabled={isPending}
                        className="text-xs border border-gray-300 rounded-lg px-2 py-1"
                      >
                        <option value="">Brak grupy</option>
                        {groups.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Cena indywidualna ma priorytet nad grupą. Zostaw puste = cena domyślna grupy/bazowa.
                  </p>
                </div>
                <div className="divide-y max-h-[500px] overflow-y-auto">
                  {products.map(p => {
                    const editVal = priceEdits[p.id]
                    const isDirty = editVal !== undefined
                    return (
                      <div key={p.id} className="p-3 flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{p.name}</div>
                          <div className="text-xs text-gray-400">{p.sku && `${p.sku} · `}Cena bazowa: {formatCurrency(p.base_price)}/{p.unit}</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="domyślna"
                              value={editVal ?? ''}
                              onChange={e => setPriceEdits(prev => ({ ...prev, [p.id]: e.target.value }))}
                              className="w-28 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <span className="text-xs text-gray-400">zł</span>
                          {isDirty && (
                            <>
                              <button
                                onClick={() => handlePriceSave(p.id, selectedCustomer)}
                                disabled={isPending}
                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setPriceEdits(prev => { const n = { ...prev }; delete n[p.id]; return n })}
                                className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {products.length === 0 && (
                    <div className="p-8 text-center text-gray-400 text-sm">Brak aktywnych produktów</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
