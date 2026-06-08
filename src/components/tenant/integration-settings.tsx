'use client'

import { useState, useTransition } from 'react'
import { KeyRound, PlugZap, RotateCcw } from 'lucide-react'
import { saveIntegration, rotateIntegrationToken } from '@/app/actions/integrations'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Integration {
  id: string
  name: string
  provider: string
  sync_mode: string
  is_active: boolean
  connection_status: string
  config: {
    base_url?: string | null
    external_warehouse_id?: string | null
    external_price_list_id?: string | null
    notes?: string | null
  } | null
  last_order_export_at: string | null
  last_invoice_import_at: string | null
}

interface Props {
  tenantSlug: string
  integrations: Integration[]
}

const PROVIDERS = [
  { value: 'generic_rest', label: 'Uniwersalne REST API' },
  { value: 'baselinker', label: 'BaseLinker' },
  { value: 'insert_subiekt', label: 'InsERT Subiekt GT / nexo' },
  { value: 'comarch_optima', label: 'Comarch ERP Optima' },
  { value: 'comarch_xl', label: 'Comarch ERP XL' },
  { value: 'enova365', label: 'enova365' },
  { value: 'symfonia', label: 'Symfonia ERP Handel' },
  { value: 'wapro', label: 'Wapro MAG' },
  { value: 'custom', label: 'Inny system klienta' },
]

const MODES = [
  { value: 'api_pull', label: 'ERP pobiera zamówienia z API' },
  { value: 'webhook_push', label: 'Portal wysyła webhook do ERP' },
  { value: 'middleware', label: 'Konektor/middleware klienta' },
  { value: 'manual', label: 'Tryb ręczny / import plików' },
]

export function IntegrationSettings({ tenantSlug, integrations }: Props) {
  const [pending, startTransition] = useTransition()
  const [token, setToken] = useState<string | null>(null)
  const primary = integrations[0]

  function handleSave(formData: FormData) {
    startTransition(async () => {
      const result = await saveIntegration(tenantSlug, formData)
      if (result?.error) toast.error(result.error)
      else toast.success('Integracja zapisana')
    })
  }

  function handleRotateToken(integrationId: string) {
    startTransition(async () => {
      const result = await rotateIntegrationToken(tenantSlug, integrationId)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      setToken(result.token!)
      toast.success('Wygenerowano nowy token API')
    })
  }

  return (
    <div className="space-y-6">
      <section className="premium-hero p-6 md:p-8">
        <div className="relative z-10 max-w-3xl">
          <div className="premium-pill mb-5">
            <PlugZap className="mr-2 h-3.5 w-3.5" />
            ERP / WMS / faktury
          </div>
          <h1 className="text-3xl font-black tracking-tight md:text-5xl">
            Integracje przygotowane pod system klienta.
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-300 md:text-base">
            Wygeneruj token i podepnij konektor klienta. ERP może pobierać zamówienia, a po wystawieniu faktury odesłać jej numer i link PDF do panelu B2B.
          </p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <form action={handleSave} className="premium-card space-y-5 p-6">
          <input type="hidden" name="id" defaultValue={primary?.id ?? ''} />

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-800">Nazwa integracji</label>
            <input name="name" defaultValue={primary?.name ?? 'Integracja ERP'} className="premium-input w-full" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-800">System klienta</label>
              <select name="provider" defaultValue={primary?.provider ?? 'generic_rest'} className="premium-input w-full">
                {PROVIDERS.map(provider => (
                  <option key={provider.value} value={provider.value}>{provider.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-800">Tryb synchronizacji</label>
              <select name="sync_mode" defaultValue={primary?.sync_mode ?? 'api_pull'} className="premium-input w-full">
                {MODES.map(mode => (
                  <option key={mode.value} value={mode.value}>{mode.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-800">Adres bazowy ERP/middleware</label>
            <input
              name="base_url"
              defaultValue={primary?.config?.base_url ?? ''}
              placeholder="https://erp.twoja-firma.pl/api lub adres konektora"
              className="premium-input w-full"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-800">ID magazynu w ERP</label>
              <input name="external_warehouse_id" defaultValue={primary?.config?.external_warehouse_id ?? ''} className="premium-input w-full" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-800">ID cennika w ERP</label>
              <input name="external_price_list_id" defaultValue={primary?.config?.external_price_list_id ?? ''} className="premium-input w-full" />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-800">Notatki wdrożeniowe</label>
            <textarea
              name="notes"
              rows={4}
              defaultValue={primary?.config?.notes ?? ''}
              className="premium-input w-full resize-none"
              placeholder="Np. mapowanie statusów, magazyn domyślny, serie faktur, osoba techniczna po stronie klienta."
            />
          </div>

          <label className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm font-semibold text-slate-700">
            <input type="checkbox" name="is_active" value="true" defaultChecked={primary?.is_active ?? false} />
            Integracja aktywna
          </label>

          <div className="flex justify-end">
            <Button type="submit" loading={pending}>Zapisz konfigurację</Button>
          </div>
        </form>

        <aside className="space-y-4">
          <div className="premium-card p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-slate-950 p-2 text-white">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-black text-slate-950">Token API</h2>
                <p className="text-sm text-slate-500">Dla konektora ERP/WMS.</p>
              </div>
            </div>

            {primary ? (
              <Button type="button" variant="secondary" className="w-full" loading={pending} onClick={() => handleRotateToken(primary.id)}>
                <RotateCcw className="h-4 w-4" />
                Wygeneruj nowy token
              </Button>
            ) : (
              <p className="rounded-lg bg-amber-50 p-3 text-sm font-medium text-amber-800">
                Najpierw zapisz konfigurację integracji.
              </p>
            )}

            {token && (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <div className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Pokazujemy tylko raz</div>
                <code className="mt-2 block break-all rounded bg-white p-2 text-xs text-slate-800">{token}</code>
              </div>
            )}
          </div>

          <div className="premium-card p-5 text-sm text-slate-600">
            <h2 className="mb-3 font-black text-slate-950">Endpointy dla klienta</h2>
            <div className="space-y-3">
              <div>
                <div className="font-bold text-slate-800">Pobranie zamówień</div>
                <code className="block break-all text-xs">GET /api/integrations/v1/orders</code>
              </div>
              <div>
                <div className="font-bold text-slate-800">Dodanie faktury do zamówienia</div>
                <code className="block break-all text-xs">POST /api/integrations/v1/orders/{'{orderId}'}/invoice</code>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
