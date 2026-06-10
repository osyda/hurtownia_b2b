'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ShieldCheck, SlidersHorizontal, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ConsentChoice = 'necessary' | 'all'

const CONSENT_KEY = 'dostawio_cookie_consent'
const CONSENT_VERSION = '2026-06-10'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 180

function getCookieDomain() {
  if (typeof window === 'undefined') return ''
  const host = window.location.hostname
  if (host === 'dostawio.pl' || host.endsWith('.dostawio.pl')) return '; domain=.dostawio.pl'
  return ''
}

function saveConsent(choice: ConsentChoice) {
  const payload = JSON.stringify({
    choice,
    version: CONSENT_VERSION,
    savedAt: new Date().toISOString(),
  })

  window.localStorage.setItem(CONSENT_KEY, payload)
  document.cookie = `${CONSENT_KEY}=${encodeURIComponent(payload)}; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax${getCookieDomain()}${window.location.protocol === 'https:' ? '; Secure' : ''}`
}

function hasConsent() {
  if (typeof window === 'undefined') return true
  return Boolean(window.localStorage.getItem(CONSENT_KEY) || document.cookie.includes(`${CONSENT_KEY}=`))
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    setVisible(!hasConsent())
  }, [])

  function accept(choice: ConsentChoice) {
    saveConsent(choice)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-[80] px-4 pb-4 sm:px-6">
      <div className="mx-auto max-w-5xl rounded-xl border border-[#E2DCD0] bg-white p-4 shadow-[0_18px_60px_rgba(29,33,37,0.18)] ring-1 ring-slate-950/[0.04] sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
          <div className="flex gap-3">
            <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#F8F5EF] text-[#1D2125]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-950">Ustawienia prywatności i cookies</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Używamy niezbędnych plików cookies i podobnych technologii, aby platforma działała poprawnie.
                Opcjonalne cookies analityczne lub marketingowe uruchomimy wyłącznie po Twojej zgodzie.
              </p>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium text-slate-500">
                <Link href="/polityka-prywatnosci" className="underline-offset-4 hover:underline">Polityka prywatności</Link>
                <Link href="/regulamin" className="underline-offset-4 hover:underline">Regulamin</Link>
                <button type="button" onClick={() => setSettingsOpen(value => !value)} className="inline-flex items-center gap-1 underline-offset-4 hover:underline">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  {settingsOpen ? 'Ukryj szczegóły' : 'Pokaż szczegóły'}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
            <button
              type="button"
              onClick={() => accept('all')}
              className="rounded-lg bg-[#1D2125] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5"
            >
              Akceptuję wszystkie
            </button>
            <button
              type="button"
              onClick={() => accept('necessary')}
              className="rounded-lg border border-[#D9D5CC] bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-[#F8F5EF]"
            >
              Tylko niezbędne
            </button>
          </div>
        </div>

        {settingsOpen && (
          <div className="mt-4 grid gap-2 rounded-lg border border-[#E2DCD0] bg-[#FBFAF7] p-3 text-sm sm:grid-cols-2">
            {[
              ['Niezbędne', 'Wymagane do logowania, bezpieczeństwa, koszyka i zapamiętania wyboru cookies.'],
              ['Preferencyjne', 'Zapamiętują wygodę pracy, np. widok katalogu.'],
              ['Analityczne', 'Obecnie niewdrożone. W przyszłości tylko po zgodzie.'],
              ['Marketingowe', 'Obecnie niewdrożone. W przyszłości tylko po zgodzie.'],
            ].map(([title, text], index) => (
              <div key={title} className={cn('rounded-lg bg-white p-3', index === 0 && 'border border-[#D9D5CC]')}>
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold text-slate-900">{title}</div>
                  {index === 0 ? <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">zawsze</span> : null}
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => accept('necessary')}
          className="absolute right-5 top-5 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Zamknij baner cookies i zostaw tylko niezbędne"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

