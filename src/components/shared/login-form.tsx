'use client'

import { useActionState } from 'react'
import { loginAction } from '@/app/actions/login'
import { Loader2 } from 'lucide-react'

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, {})

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          E-mail
        </label>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="twoj@email.pl"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Hasło
        </label>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="••••••••"
        />
      </div>

      {state?.error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Zaloguj się
      </button>

      <div className="text-center">
        <a href="/reset-password" className="text-sm text-blue-600 hover:underline">
          Zapomniałem hasła
        </a>
      </div>
    </form>
  )
}
