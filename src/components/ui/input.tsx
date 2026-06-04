import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3 py-2 border rounded-lg text-sm transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white',
            className
          )}
          {...props}
        />
        {error && <p className="text-red-500 text-xs">{error}</p>}
        {hint && !error && <p className="text-gray-400 text-xs">{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
