import { cn } from '@/lib/utils'

const BRAND_ASSETS = {
  logo: '/brand/logo-horizontal.svg',
  logoLight: '/brand/logo-horizontal-darkbg.svg',
  logoVertical: '/brand/logo-vertical.svg',
  logoVerticalLight: '/brand/logo-vertical-darkbg.svg',
  logoMono: '/brand/logo-horizontal-mono.svg',
  icon: '/brand/icon-brand.svg',
  iconLight: '/brand/icon-reverse.svg',
  iconMono: '/brand/icon-mono.svg',
} as const

interface DostawioMarkProps {
  className?: string
  monochrome?: boolean
  light?: boolean
}

interface DostawioLogoProps extends DostawioMarkProps {
  compact?: boolean
  withTagline?: boolean
}

export function DostawioMark({ className, monochrome = false, light = false }: DostawioMarkProps) {
  const src = monochrome ? BRAND_ASSETS.iconMono : light ? BRAND_ASSETS.iconLight : BRAND_ASSETS.icon

  return (
    <img
      src={src}
      alt="Dostawio Connect"
      width={64}
      height={64}
      className={cn('h-10 w-10 shrink-0 rounded-lg object-contain', className)}
    />
  )
}

export function DostawioLogo({ className, compact = false, monochrome = false, light = false, withTagline = false }: DostawioLogoProps) {
  if (compact) {
    return <DostawioMark monochrome={monochrome} light={light} className={className} />
  }

  const src = monochrome
    ? BRAND_ASSETS.logoMono
    : light && withTagline
      ? BRAND_ASSETS.logoVerticalLight
    : light
      ? BRAND_ASSETS.logoLight
    : withTagline
      ? BRAND_ASSETS.logoVertical
      : BRAND_ASSETS.logo
  const dimensions = withTagline ? { width: 580, height: 520 } : { width: 758, height: 170 }

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
