'use client'

import { useActionState } from 'react'
import { loginAction } from '@/app/actions/login'
import { Loader2 } from 'lucide-react'

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, {})

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-700">
          E-mail
        </label>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="premium-input w-full"
          placeholder="twoj@email.pl"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-700">
          Hasło
        </label>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="premium-input w-full"
          placeholder="••••••••"
        />
      </div>

      {state?.error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 py-2.5 font-semibold text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow-md disabled:opacity-50"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Zaloguj się
      </button>

      <div className="text-center">
        <a href="/reset-password" className="text-sm font-medium text-slate-600 hover:text-slate-950">
          Zapomniałem hasła
        </a>
      </div>
    </form>
  )
}
