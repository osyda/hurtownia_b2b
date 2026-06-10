'use client'

import { Minus, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface CartQuantityControlProps {
  value: number
  min: number
  step: number
  unit?: string
  disabled?: boolean
  size?: 'sm' | 'md'
  className?: string
  onChange: (qty: number) => void
}

function parseDraft(value: string) {
  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

function formatQty(value: number) {
  if (!Number.isFinite(value)) return '1'
  return Number(value.toFixed(3)).toString()
}

function normalizeQty(value: number, min: number, step: number) {
  const safeStep = Number.isFinite(step) && step > 0 ? step : 1
  const safeMin = Number.isFinite(min) && min > 0 ? min : safeStep
  const safeValue = Number.isFinite(value) ? Math.max(safeMin, value) : safeMin
  const steps = Math.ceil((safeValue - safeMin) / safeStep)
  return Number((safeMin + Math.max(0, steps) * safeStep).toFixed(3))
}

export function CartQuantityControl({
  value,
  min,
  step,
  unit,
  disabled,
  size = 'md',
  className,
  onChange,
}: CartQuantityControlProps) {
  const [draft, setDraft] = useState(formatQty(value))
  const compact = size === 'sm'

  useEffect(() => {
    setDraft(formatQty(value))
  }, [value])

  function commit(raw = draft) {
    const parsed = parseDraft(raw)
    const next = normalizeQty(parsed ?? value, min, step)
    setDraft(formatQty(next))
    onChange(next)
  }

  function handleInputChange(raw: string) {
    setDraft(raw)
    const parsed = parseDraft(raw)
    if (parsed === null || raw.trim() === '') return
    if (parsed >= min) {
      onChange(Number(parsed.toFixed(3)))
    }
  }

  function adjust(delta: number) {
    const parsed = parseDraft(draft)
    const next = normalizeQty((parsed ?? value) + delta, min, step)
    setDraft(formatQty(next))
    onChange(next)
  }

  return (
    <div
      className={cn(
        'inline-flex items-stretch overflow-hidden rounded-lg border border-[#D9D5CC] bg-white shadow-sm',
        disabled && 'opacity-60',
        className
      )}
    >
      <button
        type="button"
        onClick={() => adjust(-step)}
        disabled={disabled}
        className={cn(
          'grid place-items-center text-slate-600 transition hover:bg-[#F4F1EC] active:scale-95 disabled:pointer-events-none',
          compact ? 'w-8' : 'w-10'
        )}
        aria-label="Zmniejsz ilość"
      >
        <Minus className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      </button>
      <input
        type="text"
        inputMode="decimal"
        value={draft}
        onChange={event => handleInputChange(event.target.value)}
        onBlur={() => commit()}
        onKeyDown={event => {
          if (event.key === 'Enter') {
            event.currentTarget.blur()
          }
        }}
        disabled={disabled}
        className={cn(
          'border-x border-[#D9D5CC] bg-white text-center font-black text-slate-950 outline-none transition focus:bg-[#F8F5EF]',
          compact ? 'w-12 px-1 py-1 text-xs' : 'w-16 px-2 py-1.5 text-sm'
        )}
        aria-label="Ilość"
      />
      <button
        type="button"
        onClick={() => adjust(step)}
        disabled={disabled}
        className={cn(
          'grid place-items-center text-slate-600 transition hover:bg-[#F4F1EC] active:scale-95 disabled:pointer-events-none',
          compact ? 'w-8' : 'w-10'
        )}
        aria-label="Zwiększ ilość"
      >
        <Plus className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      </button>
      {unit ? (
        <span className={cn('grid place-items-center px-2 font-bold text-slate-400', compact ? 'text-[10px]' : 'text-xs')}>
          {unit}
        </span>
      ) : null}
    </div>
  )
}
