export const DOSTAWIO_BRAND = {
  graphite: '#1D2125',
  graphiteSoft: '#363A3D',
  ink: '#16191C',
  amber: '#E08A2B',
  amberDark: '#C7741F',
  ivory: '#F4F1EC',
  paper: '#FBFAF7',
  stone: '#E2DCD0',
} as const

const LEGACY_BRAND_COLORS = new Set([
  '#020617',
  '#0f172a',
  '#1d2125',
  '#16191c',
  '#363a3d',
  '#1d4ed8',
  '#2563eb',
  '#3b82f6',
])

export function resolveBrandColor(color?: string | null) {
  const normalized = color?.trim().toLowerCase()
  if (!normalized || LEGACY_BRAND_COLORS.has(normalized)) {
    return DOSTAWIO_BRAND.graphite
  }

  return color!
}

export function resolveAccentColor(color?: string | null) {
  const normalized = color?.trim().toLowerCase()
  if (!normalized || LEGACY_BRAND_COLORS.has(normalized)) {
    return DOSTAWIO_BRAND.amber
  }

  return color!
}
