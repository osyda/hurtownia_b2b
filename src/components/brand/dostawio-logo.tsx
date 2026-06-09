import { cn } from '@/lib/utils'

interface DostawioMarkProps {
  className?: string
  monochrome?: boolean
}

interface DostawioLogoProps extends DostawioMarkProps {
  compact?: boolean
  light?: boolean
  showConnect?: boolean
}

export function DostawioMark({ className, monochrome = false }: DostawioMarkProps) {
  const dark = monochrome ? 'currentColor' : '#303030'
  const forest = monochrome ? 'currentColor' : '#0F4D38'
  const teal = monochrome ? 'currentColor' : '#27C7C3'

  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={cn('h-10 w-10 shrink-0', className)}>
      <path
        d="M11 12h20.8C44.4 12 54 20.6 54 32s-9.6 20-22.2 20H11v-9.2h20.5c7.2 0 12.5-4.4 12.5-10.8S38.7 21.2 31.5 21.2H20.2V52H11V12Z"
        fill={dark}
      />
      <path d="M18.2 43.2 33.8 27.6" fill="none" stroke={forest} strokeLinecap="round" strokeWidth="4.8" />
      <circle cx="17" cy="44.5" r="8.2" fill="#F7F5EF" stroke={teal} strokeWidth="4.8" />
      <circle cx="35.5" cy="26" r="8.2" fill="#F7F5EF" stroke={forest} strokeWidth="4.8" />
    </svg>
  )
}

export function DostawioLogo({ className, compact = false, light = false, showConnect = true }: DostawioLogoProps) {
  return (
    <div className={cn('inline-flex items-center gap-3', className)}>
      <DostawioMark className={compact ? 'h-9 w-9' : 'h-11 w-11'} />
      {!compact && (
        <div className="leading-none">
          <div className={cn('text-2xl font-black tracking-tight', light ? 'text-white' : 'text-[#303030]')}>
            Dostawio
            <span className="text-[#27C7C3]">.</span>
          </div>
          {showConnect && (
            <div className={cn('mt-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.42em]', light ? 'text-white/75' : 'text-[#0F4D38]')}>
              <span className="h-px w-8 bg-[#27C7C3]" />
              Connect
              <span className="h-px w-8 bg-[#27C7C3]" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
