'use client'

import { useActionState } from 'react'
import { ArrowRight, Loader2 } from 'lucide-react'
import { loginAction } from '@/app/actions/login'

interface LoginFormProps {
  buttonLabel?: string
  emailPlaceholder?: string
  passwordPlaceholder?: string
  helperText?: string
}

export function LoginForm({
  buttonLabel = 'Wejdź do Dostawio',
  emailPlaceholder = 'adres@email.pl',
  passwordPlaceholder = 'Wpisz swoje hasło',
  helperText = 'System rozpozna konto i przekieruje Cię do właściwego panelu.',
}: LoginFormProps) {
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
          placeholder={emailPlaceholder}
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
          placeholder={passwordPlaceholder}
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
        className="brand-button flex w-full py-3 font-bold disabled:translate-y-0 disabled:opacity-50"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {buttonLabel}
        {!pending && <ArrowRight className="h-4 w-4" />}
      </button>

      <div className="rounded-lg border border-[#E2DCD0] bg-[#F8F5EF] px-3 py-3 text-xs leading-5 text-slate-500">
        {helperText}
      </div>

      <div className="text-center">
        <a href="/reset-password" className="text-sm font-semibold text-slate-600 hover:text-slate-950">
          Nie pamiętam hasła
        </a>
      </div>
    </form>
  )
}
