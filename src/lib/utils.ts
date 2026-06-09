import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'PLN') {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date) {
  return new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  new: 'Nowe',
  accepted: 'Przyjęte',
  in_progress: 'W realizacji',
  ready: 'Gotowe do dostawy',
  delivered: 'Zrealizowane',
  cancelled: 'Anulowane',
}

export const ORDER_STATUS_COLORS: Record<string, string> = {
  new: 'bg-[#E9FAF8] text-[#0F4D38]',
  accepted: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-orange-100 text-orange-800',
  ready: 'bg-[#E9FAF8] text-[#0F4D38]',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-slate-100 text-slate-800',
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash_on_delivery: 'Gotówka przy dostawie',
  transfer_7: 'Przelew 7 dni',
  transfer_14: 'Przelew 14 dni',
  transfer_30: 'Przelew 30 dni',
  card_on_delivery: 'Karta przy dostawie',
  blik_on_delivery: 'BLIK przy dostawie',
}
