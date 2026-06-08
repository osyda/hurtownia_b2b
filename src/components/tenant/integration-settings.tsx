'use client'

import { type ReactNode, useMemo, useState, useTransition } from 'react'
import {
  Activity,
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  KeyRound,
  ListChecks,
  PlugZap,
  RotateCcw,
  ServerCog,
  ShieldCheck,
} from 'lucide-react'
import { saveIntegration, rotateIntegrationToken } from '@/app/actions/integrations'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  getIntegrationProviderProfile,
  integrationCapabilityLabels,
  integrationModeLabels,
  integrationProviderProfiles,
} from '@/lib/integrations/provider-profiles'
import { formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'

export interface IntegrationSettingsRecord {
  id: string
  name: string
  provider: string
  sync_mode: string
  is_active: boolean
  connection_status: string
  config: Record<string, unknown> | null
  has_api_token?: boolean
  last_order_export_at: string | null
  last_invoice_import_at: string | null
  last_error: string | null
  created_at?: string
  updated_at?: string
}

export interface IntegrationSyncLogRecord {
  id: number
  direction: string
  entity_type: string
  operation: string
  status: string
  message: string | null
  created_at: string
}

interface Props {
  tenantSlug: string
  integrations: IntegrationSettingsRecord[]
  syncLogs: IntegrationSyncLogRecord[]
}

const customerStrategyOptions = [
  { value: 'nip', label: 'NIP kontrahenta' },
  { value: 'email', label: 'E-mail klienta' },
  { value: 'external_id', label: 'Zewnętrzne ID kontrahenta' },
  { value: 'manual', label: 'Mapowanie ręczne' },
]

const productStrategyOptions = [
  { value: 'sku', label: 'SKU / kod towaru' },
  { value: 'ean', label: 'EAN / kod kreskowy' },
  { value: 'external_id', label: 'Zewnętrzne ID towaru' },
  { value: 'manual', label: 'Mapowanie ręczne' },
]

const connectionStatusLabels: Record<string, string> = {
  not_configured: 'Do konfiguracji',
  ready: 'Gotowa',
  error: 'Błąd',
  paused: 'Wstrzymana',
}

const logOperationLabels: Record<string, string> = {
  health_check: 'Test połączenia',
  list_orders: 'Pobranie zamówień',
  upsert_invoice: 'Import faktury',
  stock_update: 'Aktualizacja stanów',
  status_update: 'Aktualizacja statusu',
}

function configString(config: Record<string, unknown> | null | undefined, key: string, fallback = '') {
  const value = config?.[key]
  return typeof value === 'string' ? value : fallback
}

function configBoolean(config: Record<string, unknown> | null | undefined, key: string, fallback = false) {
  const value = config?.[key]
  return typeof value === 'boolean' ? value : fallback
}

function statusVariant(status: string): 'default' | 'success' | 'warning' | 'error' | 'gray' {
  if (status === 'ready' || status === 'success') return 'success'
  if (status === 'error') return 'error'
  if (status === 'paused' || status === 'skipped') return 'warning'
  return 'gray'
}

function Endpoint({ method, path, description }: { method: string; path: string; description: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="mb-1 flex items-center justify-between gap-3">
        <Badge variant={method === 'GET' ? 'default' : 'gray'}>{method}</Badge>
        <span className="text-xs font-semibold text-slate-400">{description}</span>
      </div>
      <code className="block break-all text-xs font-semibold text-slate-800">{path}</code>
    </div>
  )
}

function ChecklistItem({ done, children }: { done: boolean; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      {done ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
      ) : (
        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
      )}
      <span className={done ? 'font-semibold text-slate-800' : 'text-slate-500'}>{children}</span>
    </li>
  )
}

function ScopeCheckbox({ name, label, hint, defaultChecked }: { name: string; label: string; hint: string; defaultChecked: boolean }) {
  return (
    <label className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3">
      <input type="checkbox" name={name} value="true" defaultChecked={defaultChecked} className="mt-1 rounded" />
      <span>
        <span className="block text-sm font-bold text-slate-900">{label}</span>
        <span className="text-xs leading-5 text-slate-500">{hint}</span>
      </span>
    </label>
  )
}

export function IntegrationSettings({ tenantSlug, integrations, syncLogs }: Props) {
  const [pending, startTransition] = useTransition()
  const [token, setToken] = useState<string | null>(null)
  const primary = integrations[0]
  const primaryConfig = primary?.config ?? null
  const [selectedProvider, setSelectedProvider] = useState(primary?.provider ?? 'generic_rest')
  const [selectedMode, setSelectedMode] = useState(primary?.sync_mode ?? 'api_pull')
  const selectedProfile = useMemo(() => getIntegrationProviderProfile(selectedProvider), [selectedProvider])

  const hasMapping = Boolean(
    configString(primaryConfig, 'external_customer_id_strategy', 'nip') &&
    configString(primaryConfig, 'external_product_id_strategy', 'sku')
  )
  const hasTechnicalContact = Boolean(
    configString(primaryConfig, 'technical_contact_name') ||
    configString(primaryConfig, 'technical_contact_email')
  )

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
        <div className="relative z-10 max-w-4xl">
          <div className="premium-pill mb-5">
            <PlugZap className="mr-2 h-3.5 w-3.5" />
            ERP / WMS / faktury
          </div>
          <h1 className="text-3xl font-black tracking-tight md:text-5xl">
            Centrum integracji hurtowni.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
            Przygotuj token, wybierz system klienta i przekaż integratorowi gotowe endpointy. Konektor może pobierać zamówienia,
            odsyłać faktury, aktualizować statusy oraz stany magazynowe po SKU.
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Status</div>
              <div className="mt-1 text-lg font-black text-white">
                {connectionStatusLabels[primary?.connection_status ?? 'not_configured'] ?? 'Do konfiguracji'}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Token</div>
              <div className="mt-1 text-lg font-black text-white">{primary?.has_api_token ? 'Wygenerowany' : 'Brak tokena'}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Profil</div>
              <div className="mt-1 text-lg font-black text-white">{selectedProfile.shortLabel}</div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_390px]">
        <form action={handleSave} className="premium-card space-y-6 p-5 md:p-6">
          <input type="hidden" name="id" defaultValue={primary?.id ?? ''} />

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <ServerCog className="h-5 w-5 text-slate-500" />
              <h2 className="text-lg font-black text-slate-950">Profil systemu</h2>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-800">Nazwa integracji</label>
              <input name="name" defaultValue={primary?.name ?? 'Integracja ERP'} className="premium-input w-full" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-800">System klienta</label>
                <select
                  name="provider"
                  value={selectedProvider}
                  onChange={event => setSelectedProvider(event.target.value)}
                  className="premium-input w-full"
                >
                  {integrationProviderProfiles.map(provider => (
                    <option key={provider.value} value={provider.value}>{provider.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-800">Tryb synchronizacji</label>
                <select
                  name="sync_mode"
                  value={selectedMode}
                  onChange={event => setSelectedMode(event.target.value)}
                  className="premium-input w-full"
                >
                  {Object.entries(integrationModeLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default">{selectedProfile.difficulty}</Badge>
                <Badge variant="gray">Rekomendacja: {integrationModeLabels[selectedProfile.recommendedMode]}</Badge>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{selectedProfile.summary}</p>
              <p className="mt-2 text-sm font-semibold text-slate-800">{selectedProfile.bestFor}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedProfile.capabilities.map(capability => (
                  <Badge key={capability} variant="success">{integrationCapabilityLabels[capability]}</Badge>
                ))}
              </div>
              {selectedProfile.docsUrl && (
                <a
                  href={selectedProfile.docsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-slate-950 hover:text-blue-700"
                >
                  Dokumentacja systemu <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-slate-500" />
              <h2 className="text-lg font-black text-slate-950">Połączenie i identyfikatory</h2>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-800">Adres bazowy ERP/middleware</label>
              <input
                name="base_url"
                defaultValue={configString(primaryConfig, 'base_url')}
                placeholder="https://erp.twoja-firma.pl/api lub adres konektora"
                className="premium-input w-full"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-800">ID magazynu w ERP</label>
                <input name="external_warehouse_id" defaultValue={configString(primaryConfig, 'external_warehouse_id')} className="premium-input w-full" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-800">ID cennika w ERP</label>
                <input name="external_price_list_id" defaultValue={configString(primaryConfig, 'external_price_list_id')} className="premium-input w-full" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-800">Seria faktur</label>
                <input name="invoice_series" defaultValue={configString(primaryConfig, 'invoice_series')} placeholder="np. FV/B2B" className="premium-input w-full" />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-slate-500" />
              <h2 className="text-lg font-black text-slate-950">Mapowanie danych</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-800">Identyfikacja kontrahenta</label>
                <select
                  name="external_customer_id_strategy"
                  defaultValue={configString(primaryConfig, 'external_customer_id_strategy', 'nip')}
                  className="premium-input w-full"
                >
                  {customerStrategyOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-800">Identyfikacja towaru</label>
                <select
                  name="external_product_id_strategy"
                  defaultValue={configString(primaryConfig, 'external_product_id_strategy', 'sku')}
                  className="premium-input w-full"
                >
                  {productStrategyOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-800">Mapowanie statusów ERP</label>
              <textarea
                name="order_status_mapping"
                rows={4}
                defaultValue={configString(primaryConfig, 'order_status_mapping')}
                className="premium-input w-full resize-none"
                placeholder="Np. ZK_NOWE -> accepted, W_REALIZACJI -> in_progress, FV_WYSTAWIONA -> ready."
              />
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-slate-500" />
              <h2 className="text-lg font-black text-slate-950">Zakres synchronizacji</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <ScopeCheckbox
                name="invoice_sync_enabled"
                label="Faktury z ERP do panelu"
                hint="Po wystawieniu faktury ERP odsyła numer, termin płatności i link PDF."
                defaultChecked={configBoolean(primaryConfig, 'invoice_sync_enabled', true)}
              />
              <ScopeCheckbox
                name="status_sync_enabled"
                label="Statusy zamówień"
                hint="ERP może aktualizować status realizacji zamówienia."
                defaultChecked={configBoolean(primaryConfig, 'status_sync_enabled', true)}
              />
              <ScopeCheckbox
                name="stock_sync_enabled"
                label="Stany magazynowe"
                hint="Konektor aktualizuje ilość i dostępność produktów po SKU."
                defaultChecked={configBoolean(primaryConfig, 'stock_sync_enabled')}
              />
              <ScopeCheckbox
                name="price_sync_enabled"
                label="Ceny z ERP"
                hint="Zakres przygotowany konfiguracyjnie; pełna automatyzacja wymaga mapowania cenników."
                defaultChecked={configBoolean(primaryConfig, 'price_sync_enabled')}
              />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-black text-slate-950">Kontakt i notatki</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-800">Osoba techniczna</label>
                <input name="technical_contact_name" defaultValue={configString(primaryConfig, 'technical_contact_name')} className="premium-input w-full" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-800">E-mail techniczny</label>
                <input name="technical_contact_email" type="email" defaultValue={configString(primaryConfig, 'technical_contact_email')} className="premium-input w-full" />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-800">Notatki wdrożeniowe</label>
              <textarea
                name="notes"
                rows={4}
                defaultValue={configString(primaryConfig, 'notes')}
                className="premium-input w-full resize-none"
                placeholder="Np. operator ERP, magazyn domyślny, ograniczenia klienta, harmonogram uruchomienia."
              />
            </div>
          </section>

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

          <div className="premium-card p-5">
            <h2 className="mb-4 font-black text-slate-950">Checklista wdrożenia</h2>
            <ul className="space-y-3">
              <ChecklistItem done={Boolean(primary)}>Konfiguracja integracji zapisana</ChecklistItem>
              <ChecklistItem done={Boolean(primary?.has_api_token)}>Token API wygenerowany</ChecklistItem>
              <ChecklistItem done={hasMapping}>Ustalony klucz kontrahenta i towaru</ChecklistItem>
              <ChecklistItem done={Boolean(configString(primaryConfig, 'external_warehouse_id'))}>Uzupełniony magazyn ERP</ChecklistItem>
              <ChecklistItem done={hasTechnicalContact}>Wpisany kontakt techniczny klienta</ChecklistItem>
            </ul>
          </div>

          <div className="premium-card p-5 text-sm text-slate-600">
            <h2 className="mb-4 font-black text-slate-950">Endpointy dla integratora</h2>
            <div className="space-y-3">
              <Endpoint method="GET" path="/api/integrations/v1/health" description="test tokena" />
              <Endpoint method="GET" path="/api/integrations/v1/orders" description="zamówienia" />
              <Endpoint method="POST" path="/api/integrations/v1/orders/{orderId}/invoice" description="faktura" />
              <Endpoint method="POST" path="/api/integrations/v1/orders/{orderId}/status" description="status ERP" />
              <Endpoint method="POST" path="/api/integrations/v1/products/stock" description="stany SKU" />
            </div>
          </div>

          <div className="premium-card p-5">
            <h2 className="mb-4 font-black text-slate-950">Ostatnie zdarzenia</h2>
            {syncLogs.length ? (
              <div className="space-y-3">
                {syncLogs.map(log => (
                  <div key={log.id} className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <Badge variant={statusVariant(log.status)}>{log.status === 'success' ? 'OK' : log.status}</Badge>
                      <span className="text-xs font-semibold text-slate-400">{formatDateTime(log.created_at)}</span>
                    </div>
                    <div className="text-sm font-bold text-slate-900">{logOperationLabels[log.operation] ?? log.operation}</div>
                    {log.message && <div className="mt-1 text-xs leading-5 text-slate-500">{log.message}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
                Brak logów. Pierwsze wpisy pojawią się po teście tokena albo synchronizacji.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
