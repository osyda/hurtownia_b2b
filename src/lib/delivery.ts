export const DELIVERY_WINDOWS = [
  '08:00-11:00',
  '11:00-15:00',
  '15:00-18:00',
] as const

export const DELIVERY_DAY_LABELS = ['', 'Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Niedz'] as const

export function getNextDeliveryDates(deliveryDays: number[], cutoffTime: string, limit = 7) {
  const dates: string[] = []
  const now = new Date()
  const [hh = 20, mm = 0] = cutoffTime.split(':').map(Number)
  const cutoff = new Date(now)
  cutoff.setHours(hh, mm, 0, 0)

  const d = new Date(now)
  if (now >= cutoff) d.setDate(d.getDate() + 1)

  while (dates.length < limit) {
    const dow = d.getDay() === 0 ? 7 : d.getDay()
    if (deliveryDays.includes(dow)) dates.push(d.toISOString().slice(0, 10))
    d.setDate(d.getDate() + 1)
  }

  return dates
}

export function isPastDeliveryDate(value: string) {
  if (!value) return false
  const today = new Date().toISOString().slice(0, 10)
  return value < today
}
