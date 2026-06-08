import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  ExternalLink,
  Globe2,
  KeyRound,
  PackageCheck,
  Send,
  Store,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { OnboardingState } from '@/lib/onboarding'

interface TenantLaunchPackProps {
  tenantName: string
  tenantSlug: string
  panelUrl: string
  shopUrl: string
  onboarding: OnboardingState
}

export function TenantLaunchPack({
  tenantName,
  tenantSlug,
  panelUrl,
  shopUrl,
  onboarding,
}: TenantLaunchPackProps) {
  const itemDone = (id: string) => onboarding.items.find(item => item.id === id)?.done ?? false
  const criticalReady = ['company', 'payments', 'products', 'customers'].every(itemDone)
  const nextItem = onboarding.items.find(item => !item.done)

  const steps = [
    {
      title: 'Konto hurtowni utworzone',
      description: `${tenantName} ma już slug, panel i adres sklepu.`,
      done: true,
      href: panelUrl,
      external: true,
    },
    {
      title: 'Dane, płatności i dostawy',
      description: 'Uzupełnij podstawy, żeby zamówienie klienta nie zatrzymało się w koszyku.',
      done: itemDone('company') && itemDone('payments') && itemDone('delivery'),
      href: `/${tenantSlug}/settings`,
      external: false,
    },
    {
      title: 'Katalog i ceny',
      description: 'Kategorie, produkty, SKU i grupy cenowe przygotowują hurtownię pod sprzedaż oraz API.',
      done: itemDone('categories') && itemDone('products') && itemDone('prices'),
      href: `/${tenantSlug}/products`,
      external: false,
    },
    {
      title: 'Klient testowy z płatnością',
      description: 'Klient musi mieć przypisane formy płatności, żeby zobaczył je podczas składania zamówienia.',
      done: itemDone('customers'),
      href: `/${tenantSlug}/customers`,
      external: false,
    },
    {
      title: 'Test zamówienia i integracji',
      description: 'Na końcu robimy zamówienie kontrolne oraz konfigurujemy token API dla ERP/WMS.',
      done: itemDone('first_order') || itemDone('integrations'),
      href: `/${tenantSlug}/integrations`,
      external: false,
    },
  ]

  return (
    <section className="premium-card overflow-hidden">
      <div className="grid gap-0 lg:grid-cols-[0.82fr_1.18fr]">
        <div className="bg-slate-950 p-5 text-white">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="inline-flex rounded-lg bg-white/10 p-2">
              <PackageCheck className="h-5 w-5 text-emerald-200" />
            </div>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-slate-300">
              Launch pack
            </span>
          </div>

          <h2 className="text-2xl font-black tracking-tight">Uruchomienie hurtowni</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Ten panel mówi, czy hurtownia jest gotowa do pierwszego klienta i co trzeba jeszcze domknąć.
          </p>

          <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.06] p-4">
            <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Status</div>
            <div className="mt-2 flex items-end justify-between gap-4">
              <div>
                <div className="text-3xl font-black">{onboarding.score}%</div>
                <div className="mt-1 text-sm font-semibold text-slate-300">{onboarding.label}</div>
              </div>
              {criticalReady ? (
                <CheckCircle2 className="h-8 w-8 text-emerald-200" />
              ) : (
                <Circle className="h-8 w-8 text-slate-500" />
              )}
            </div>
            <div className="mt-4 h-2 rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-emerald-300"
                style={{ width: `${onboarding.score}%` }}
              />
            </div>
          </div>

          <div className="mt-4 grid gap-2">
            <LaunchLink icon={Globe2} label="Panel hurtowni" href={panelUrl} />
            <LaunchLink icon={Store} label="Sklep klienta" href={shopUrl} />
          </div>
        </div>

        <div className="p-5">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-sm font-black uppercase tracking-[0.16em] text-slate-400">
                Kolejność działań
              </div>
              <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                Co robimy po utworzeniu firmy
              </h3>
            </div>
            {nextItem && (
              <Link
                href={nextItem.href}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                Następny krok
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={step.title} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex gap-3">
                  <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                    step.done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {step.done ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h4 className="font-black text-slate-950">{step.title}</h4>
                      {step.external ? (
                        <a
                          href={step.href}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 hover:underline"
                        >
                          Otwórz
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <Link href={step.href} className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 hover:underline">
                          Przejdź
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <KeyRound className="mb-3 h-5 w-5 text-slate-500" />
              <div className="font-black text-slate-950">Dostęp administracyjny</div>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Administrator hurtowni loguje się przez app.dostawio.pl i trafia do własnej firmy.
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <Send className="mb-3 h-5 w-5 text-slate-500" />
              <div className="font-black text-slate-950">Zaproszenie klienta</div>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Po dodaniu klienta możesz przypisać płatności i wysłać mu dostęp do sklepu.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function LaunchLink({
  icon: Icon,
  label,
  href,
}: {
  icon: LucideIcon
  label: string
  href: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10"
    >
      <span className="flex min-w-0 items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-slate-400" />
        <span>{label}</span>
      </span>
      <ExternalLink className="h-4 w-4 shrink-0 text-slate-400" />
    </a>
  )
}
