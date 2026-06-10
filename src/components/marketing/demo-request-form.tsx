'use client'

import { useActionState } from 'react'
import { ArrowRight, Loader2 } from 'lucide-react'
import { requestDemoAction } from '@/app/actions/demo'
import type { DemoRequestState } from '@/app/actions/demo'

export function DemoRequestForm() {
  const initialState: DemoRequestState = {}
  const [state, action, pending] = useActionState(requestDemoAction, initialState)

  return (
    <form id="demo" action={action} className="rounded-lg border border-[#E2DCD0] bg-white p-4 shadow-sm sm:p-5">
      <div>
        <div className="text-xs font-black uppercase tracking-[0.18em] text-[#1D2125]">Demo dla hurtowni</div>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-[#1D2125]">Poproś o dostęp do demo</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Dane logowania nie są publiczne. Wyślę je po krótkim kontakcie i sprawdzeniu potrzeb hurtowni.
        </p>
      </div>

      <div className="mt-5 grid gap-3">
        <div className="grid gap-3 sm:grid-cols-[1.15fr_0.85fr]">
          <input name="company" required placeholder="Nazwa hurtowni" className="premium-input w-full" />
          <input
            name="nip"
            required
            inputMode="numeric"
            placeholder="NIP hurtowni"
            className="premium-input w-full"
          />
        </div>
        <input name="name" required placeholder="Imię i nazwisko" className="premium-input w-full" />
        <div className="grid gap-3 sm:grid-cols-2">
          <input name="email" type="email" required placeholder="E-mail" className="premium-input w-full" />
          <input name="phone" required placeholder="Telefon" className="premium-input w-full" />
        </div>
        <textarea
          name="message"
          rows={3}
          placeholder="Krótko: ile produktów, ilu klientów B2B, z jakiego systemu korzystasz?"
          className="premium-input w-full resize-none"
        />
      </div>

      {state?.error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="mt-3 rounded-lg border border-[#F0D3B3] bg-[#FFF7ED] px-3 py-2 text-sm font-semibold text-[#1D2125]">
          {state.success}
        </p>
      )}

      <button type="submit" disabled={pending} className="brand-button mt-4 w-full px-5 py-3">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Wyślij prośbę o demo
        {!pending ? <ArrowRight className="h-4 w-4" /> : null}
      </button>
    </form>
  )
}
