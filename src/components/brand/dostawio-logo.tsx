import { cn } from '@/lib/utils'

const BRAND_ASSETS = {
  logo: '/brand/dostawio-horizontal-color.svg',
  logoTagline: '/brand/dostawio-full-color.svg',
  logoMono: '/brand/dostawio-horizontal-mono.svg',
  icon: '/brand/dostawio-icon-color.svg',
  iconMono: '/brand/dostawio-icon-mono.svg',
} as const

interface DostawioMarkProps {
  className?: string
  monochrome?: boolean
}

interface DostawioLogoProps extends DostawioMarkProps {
  compact?: boolean
  light?: boolean
  withTagline?: boolean
}

export function DostawioMark({ className, monochrome = false }: DostawioMarkProps) {
  return (
    <img
      src={monochrome ? BRAND_ASSETS.iconMono : BRAND_ASSETS.icon}
      alt="Dostawio Connect"
      width={64}
      height={64}
      className={cn('h-10 w-10 shrink-0 rounded-lg object-contain', className)}
    />
  )
}

export function DostawioLogo({ className, compact = false, monochrome = false, withTagline = false }: DostawioLogoProps) {
  if (compact) {
    return <DostawioMark monochrome={monochrome} className={className} />
  }

  const src = monochrome ? BRAND_ASSETS.logoMono : withTagline ? BRAND_ASSETS.logoTagline : BRAND_ASSETS.logo
  const dimensions = withTagline ? { width: 1600, height: 520 } : { width: 1600, height: 410 }

  return (
    <img
      src={src}
      alt="Dostawio Connect"
      width={dimensions.width}
      height={dimensions.height}
      className={cn('h-auto w-[190px] object-contain sm:w-[250px]', className)}
    />
  )
}
