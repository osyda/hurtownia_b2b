'use client'

import { useActionState } from 'react'
import { ArrowRight, Loader2 } from 'lucide-react'
import { loginAction } from '@/app/actions/login'

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
          placeholder="osyda@icloud.com"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-bold text-slate-800">
          Hasło
        </label>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="premium-input w-full"
          placeholder="Wpisz swoje hasło"
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
        Wejdź do Dostawio
        {!pending && <ArrowRight className="h-4 w-4" />}
      </button>

      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-xs leading-5 text-slate-500">
        System rozpozna po koncie, czy masz wejść jako superadmin, hurtownia czy klient B2B.
      </div>

      <div className="text-center">
        <a href="/reset-password" className="text-sm font-semibold text-slate-600 hover:text-slate-950">
          Zapomniałem hasła
        </a>
      </div>
    </form>
  )
}
