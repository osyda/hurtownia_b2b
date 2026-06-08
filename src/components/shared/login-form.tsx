'use client'

import { useActionState } from 'react'
import { loginAction } from '@/app/actions/login'
import { Loader2 } from 'lucide-react'

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, {})

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-bold text-slate-800">
          E-mail
        </label>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="premium-input w-full"
          placeholder="kontakt@firma.pl"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-bold text-slate-800">
          Haslo
        </label>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="premium-input w-full"
          placeholder="********"
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
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 py-3 font-bold text-white shadow-xl shadow-slate-900/15 transition-all hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-2xl disabled:translate-y-0 disabled:opacity-50"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Zaloguj sie
      </button>

      <div className="text-center">
        <a href="/reset-password" className="text-sm font-semibold text-slate-600 hover:text-slate-950">
          Zapomnialem hasla
        </a>
      </div>
    </form>
  )
}
