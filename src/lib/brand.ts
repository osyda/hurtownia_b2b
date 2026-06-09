export const DOSTAWIO_BRAND = {
  graphite: '#303030',
  graphiteSoft: '#4A4A4A',
  forest: '#0F4D38',
  forestDark: '#083B2B',
  teal: '#27C7C3',
  tealDark: '#19AFA9',
  porcelain: '#F7F5EF',
  stone: '#E8E4DC',
} as const

const LEGACY_BRAND_COLORS = new Set([
  '#020617',
  '#0f172a',
  '#303030',
  '#1d4ed8',
  '#2563eb',
  '#3b82f6',
])

export function resolveBrandColor(color?: string | null) {
  const normalized = color?.trim().toLowerCase()
  if (!normalized || LEGACY_BRAND_COLORS.has(normalized)) {
    return DOSTAWIO_BRAND.forest
  }

  return color!
}

export function resolveAccentColor(color?: string | null) {
  const normalized = color?.trim().toLowerCase()
  if (!normalized || LEGACY_BRAND_COLORS.has(normalized)) {
    return DOSTAWIO_BRAND.tealDark
  }

  return color!
}
