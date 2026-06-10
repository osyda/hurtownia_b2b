'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { CheckCircle2, CircleAlert, ExternalLink, Sparkles } from 'lucide-react'
import type { OnboardingItem, OnboardingState } from '@/lib/onboarding'

interface OnboardingPanelProps {
  state: OnboardingState
  title?: string
  description?: string
  compact?: boolean
}

function priorityLabel(priority: OnboardingItem['priority']) {
  if (priority === 'critical') return 'ważne'
  if (priority === 'important') return 'konfiguracja'
  return 'rozwój'
}

function itemTone(item: OnboardingItem) {
  if (item.done) return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  if (item.priority === 'critical') return 'border-amber-200 bg-amber-50 text-amber-800'
  return 'border-slate-200 bg-slate-50 text-slate-600'
}

function StepLink({ item, children }: { item: OnboardingItem; children: ReactNode }) {
  if (item.href.startsWith('http')) {
    return (
      <a href={item.href} target="_blank" rel="noreferrer" className="block rounded-lg transition hover:-translate-y-0.5">
        {children}
      </a>
    )
  }

  return (
    <Link href={item.href} className="block rounded-lg transition hover:-translate-y-0.5">
      {children}
    </Link>
  )
}

export function OnboardingPanel({
  state,
  title = 'Gotowość hurtowni',
  description = 'Najkrótsza droga od utworzenia konta do pierwszego zamówienia klienta.',
  compact = false,
}: OnboardingPanelProps) {
  const nextItem = state.items.find(item => !item.done)
  const visibleItems = compact ? state.items.slice(0, 6) : state.items

  return (
    <section className="premium-card overflow-hidden">
      <div className="grid gap-5 border-b border-slate-200/80 bg-white p-5 lg:grid-cols-[1fr_220px] lg:items-center">
        <div>
          <div className="mb-3 inline-flex items-center rounded-full bg-[#1D2125] px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-white">
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            {state.label}
          </div>
          <h2 className="text-xl font-black tracking-tight text-slate-950">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Postęp</div>
              <div className="mt-1 text-3xl font-black text-slate-950">{state.score}%</div>
            </div>
            <div className="text-right text-sm font-bold text-slate-500">
              {state.completed}/{state.total}
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-[#1D2125] transition-all" style={{ width: `${state.score}%` }} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-5 xl:grid-cols-[1fr_320px]">
        <div className="grid gap-3 md:grid-cols-2">
          {visibleItems.map(item => (
            <StepLink key={item.id} item={item}>
              <div className={`h-full rounded-lg border p-4 ${itemTone(item)}`}>
                <div className="flex items-start gap-3">
                  {item.done ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  ) : (
                    <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-slate-950">{item.title}</h3>
                      <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">
                        {priorityLabel(item.priority)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                  </div>
                </div>
              </div>
            </StepLink>
          ))}
        </div>

        <aside className="rounded-lg border border-slate-200 bg-[#1D2125] p-5 text-white">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Następny krok</div>
          {nextItem ? (
            <div className="mt-4">
              <h3 className="text-lg font-black">{nextItem.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{nextItem.description}</p>
              {nextItem.href.startsWith('http') ? (
                <a
                  href={nextItem.href}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-black text-slate-950 transition hover:bg-slate-100"
                >
                  Otwórz krok
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : (
                <Link
                  href={nextItem.href}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-black text-slate-950 transition hover:bg-slate-100"
                >
                  Otwórz krok
                </Link>
              )}
            </div>
          ) : (
            <div className="mt-4">
              <h3 className="text-lg font-black">Fundament gotowy</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{state.summary}</p>
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}
