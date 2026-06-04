'use client'

import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:pointer-events-none'
    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700',
      secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
      ghost: 'text-gray-600 hover:bg-gray-100',
      destructive: 'bg-red-600 text-white hover:bg-red-700',
    }
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-5 py-2.5 text-base',
    }
    return (
      <button ref={ref} disabled={disabled || loading} className={cn(base, variants[variant], sizes[size], className)} {...props}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
