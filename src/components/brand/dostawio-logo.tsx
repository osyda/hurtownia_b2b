import { cn } from '@/lib/utils'

const BRAND_ASSETS = {
  logo: '/brand/dostawio-connect-logo.jpg',
  logoTagline: '/brand/dostawio-connect-logo-tagline.jpg',
  logoMono: '/brand/dostawio-connect-logo-mono.jpg',
  icon: '/brand/dostawio-connect-icon.jpg',
  iconMono: '/brand/dostawio-connect-icon-mono.jpg',
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
      width={1280}
      height={1280}
      className={cn('h-10 w-10 shrink-0 rounded-lg object-contain', className)}
    />
  )
}

export function DostawioLogo({ className, compact = false, monochrome = false, withTagline = false }: DostawioLogoProps) {
  if (compact) {
    return <DostawioMark monochrome={monochrome} className={className} />
  }

  return (
    <img
      src={monochrome ? BRAND_ASSETS.logoMono : withTagline ? BRAND_ASSETS.logoTagline : BRAND_ASSETS.logo}
      alt="Dostawio Connect"
      width={1280}
      height={427}
      className={cn('h-auto w-[190px] object-contain sm:w-[250px]', className)}
    />
  )
}
