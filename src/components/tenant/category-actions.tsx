'use client'

import { useState, useTransition } from 'react'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { createCategory, updateCategory, deleteCategory } from '@/app/actions/categories'
import { toast } from 'sonner'
import { Category } from '@/types/database.types'

interface Props {
  tenantSlug: string
  categories: Category[]
  editCategory?: Category
}

export function CategoryActions({ tenantSlug, categories, editCategory }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = editCategory
        ? await updateCategory(tenantSlug, editCategory.id, formData)
        : await createCategory(tenantSlug, formData)

      if (result?.error) {
        toast.error(result.error)
        return
      }

      toast.success(editCategory ? 'Kategoria zaktualizowana' : 'Kategoria dodana')
      setOpen(false)
    })
  }

  function handleDelete() {
    if (!editCategory) return
    if (!confirm(`Usunąć kategorię "${editCategory.name}"?`)) return

    startTransition(async () => {
      const result = await deleteCategory(tenantSlug, editCategory.id)
      if (result?.error) toast.error(result.error)
      else toast.success('Kategoria usunięta')
    })
  }

  const parentOptions = categories
    .filter(c => c.id !== editCategory?.id)
    .map(c => ({ value: c.id, label: c.name }))

  if (!open) {
    if (editCategory) {
      return (
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setOpen(true)} className="p-1 text-[#1D2125] hover:text-[#16191C]" aria-label="Edytuj kategorię">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={handleDelete} className="p-1 text-red-500 hover:text-red-600" aria-label="Usuń kategorię">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )
    }

    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Dodaj kategorię
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="premium-card w-full max-w-md p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-black text-gray-900">{editCategory ? 'Edytuj kategorię' : 'Nowa kategoria'}</h3>
          <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600" aria-label="Zamknij">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form action={handleSubmit} className="space-y-4">
          <Input label="Nazwa" name="name" defaultValue={editCategory?.name} required />
          <Select
            label="Kategoria nadrzędna"
            name="parent_id"
            defaultValue={editCategory?.parent_id ?? ''}
            placeholder="Brak (kategoria główna)"
            options={parentOptions}
          />
          <Input label="Kolejność sortowania" name="sort_order" type="number" defaultValue={String(editCategory?.sort_order ?? 0)} />
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_active" name="is_active" value="true" defaultChecked={editCategory?.is_active ?? true} className="rounded" />
            <label htmlFor="is_active" className="text-sm text-gray-700">Aktywna</label>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setOpen(false)}>Anuluj</Button>
            <Button type="submit" loading={pending} className="flex-1">{editCategory ? 'Zapisz' : 'Dodaj'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
