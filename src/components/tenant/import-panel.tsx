'use client'

import { useState, useTransition, useRef } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { importProducts, importStockLevels } from '@/app/actions/import'
import { Upload, Download, CheckCircle2, XCircle, Clock, AlertTriangle, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import { formatDateTime } from '@/lib/utils'

interface ImportLog {
  id: string
  import_type: string
  status: string
  total_rows: number
  success_rows: number
  error_rows: number
  created_at: string
  error_details: string[] | null
}

type ImportMode = 'products' | 'stock'

const PRODUCTS_TEMPLATE = [
  ['sku', 'name', 'unit', 'base_price', 'vat_rate', 'category_name', 'description', 'min_order_qty', 'order_multiple', 'stock_qty', 'stock_status'],
  ['P001', 'Przykładowy produkt', 'szt', 10.50, 23, 'Kategoria', 'Opis produktu', 1, 1, 100, 'available'],
]

const STOCK_TEMPLATE = [
  ['sku', 'stock_qty', 'stock_status'],
  ['P001', 150, 'available'],
  ['P002', 0, 'unavailable'],
]

function downloadTemplate(mode: ImportMode) {
  const data = mode === 'products' ? PRODUCTS_TEMPLATE : STOCK_TEMPLATE
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(data)
  XLSX.utils.book_append_sheet(wb, ws, 'Import')
  XLSX.writeFile(wb, mode === 'products' ? 'szablon_produkty.xlsx' : 'szablon_stany.xlsx')
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'success') return <CheckCircle2 className="h-4 w-4 text-green-500" />
  if (status === 'error') return <XCircle className="h-4 w-4 text-red-500" />
  if (status === 'partial') return <AlertTriangle className="h-4 w-4 text-orange-500" />
  return <Clock className="h-4 w-4 text-gray-400" />
}

export function ImportPanel({
  tenantSlug,
  categories,
  importLogs,
}: {
  tenantSlug: string
  categories: { id: string; name: string }[]
  importLogs: ImportLog[]
}) {
  const [mode, setMode] = useState<ImportMode>('products')
  const [isPending, startTransition] = useTransition()
  const [preview, setPreview] = useState<Record<string, unknown>[] | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const data = new Uint8Array(ev.target?.result as ArrayBuffer)
      const wb = XLSX.read(data, { type: 'array', codepage: 65001 })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })
      setPreview(rows.slice(0, 5))
    }
    reader.readAsArrayBuffer(file)
  }

  function handleImport() {
    const file = fileRef.current?.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const data = new Uint8Array(ev.target?.result as ArrayBuffer)
      const wb = XLSX.read(data, { type: 'array', codepage: 65001 })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })

      startTransition(async () => {
        let result: { success: number; errors: string[]; total: number }

        if (mode === 'products') {
          result = await importProducts(tenantSlug, rows.map(r => ({
            sku: String(r.sku || ''),
            name: String(r.name || ''),
            unit: String(r.unit || 'szt'),
            base_price: parseFloat(String(r.base_price)) || 0,
            vat_rate: parseFloat(String(r.vat_rate)) || 23,
            stock_qty: parseFloat(String(r.stock_qty)) || 0,
            stock_status: String(r.stock_status || 'available'),
            category_name: String(r.category_name || ''),
            description: String(r.description || ''),
            min_order_qty: parseFloat(String(r.min_order_qty)) || 1,
            order_multiple: parseFloat(String(r.order_multiple)) || 1,
          })))
        } else {
          result = await importStockLevels(tenantSlug, rows.map(r => ({
            sku: String(r.sku || ''),
            stock_qty: parseFloat(String(r.stock_qty)) || 0,
            stock_status: String(r.stock_status || 'available'),
          })))
        }

        if (result.errors.length === 0) {
          toast.success(`Zaimportowano ${result.success} z ${result.total} wierszy`)
        } else {
          toast.warning(`Zaimportowano ${result.success}/${result.total} — ${result.errors.length} błędów`)
        }
        setPreview(null)
        setFileName(null)
        if (fileRef.current) fileRef.current.value = ''
      })
    }
    reader.readAsArrayBuffer(file)
  }

  return (
    <div className="p-8 max-w-4xl">
      <PageHeader
        title="Import danych"
        description="Wgraj produkty lub aktualizuj stany magazynowe przez plik Excel/CSV"
      />

      {/* Mode selector */}
      <div className="flex gap-2 mb-6">
        {(['products', 'stock'] as ImportMode[]).map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); setPreview(null); setFileName(null) }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === m ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            {m === 'products' ? 'Produkty' : 'Stany magazynowe'}
          </button>
        ))}
      </div>

      {/* Upload section */}
      <div className="bg-white rounded-xl border mb-6">
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">
            {mode === 'products' ? 'Import produktów' : 'Aktualizacja stanów magazynowych'}
          </h2>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => downloadTemplate(mode)}
          >
            <Download className="h-4 w-4" />
            Pobierz szablon
          </Button>
        </div>

        <div className="p-5 space-y-4">
          <div className="text-sm text-gray-500">
            {mode === 'products'
              ? 'Kolumny: sku, name*, unit, base_price, vat_rate, category_name, description, min_order_qty, order_multiple, stock_qty, stock_status. Jeśli SKU już istnieje — produkt zostanie zaktualizowany.'
              : 'Kolumny: sku*, stock_qty*, stock_status. Aktualizuje stany dla istniejących produktów po SKU.'}
          </div>

          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-8 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
            <Upload className="h-8 w-8 text-gray-400 mb-2" />
            <span className="text-sm font-medium text-gray-700">
              {fileName ?? 'Kliknij lub przeciągnij plik'}
            </span>
            <span className="text-xs text-gray-400 mt-1">Excel (.xlsx) lub CSV</span>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>

          {preview && (
            <div>
              <div className="text-xs text-gray-500 mb-2">Podgląd (pierwsze 5 wierszy):</div>
              <div className="overflow-x-auto">
                <table className="text-xs w-full border-collapse">
                  <thead>
                    <tr>
                      {Object.keys(preview[0] ?? {}).map(k => (
                        <th key={k} className="text-left px-2 py-1 bg-gray-50 border border-gray-200 font-medium text-gray-600">{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i}>
                        {Object.values(row).map((v, j) => (
                          <td key={j} className="px-2 py-1 border border-gray-200 text-gray-700">{String(v)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {fileName && (
            <div className="flex gap-2">
              <Button onClick={handleImport} loading={isPending}>
                <Upload className="h-4 w-4" />
                Importuj
              </Button>
              <Button
                variant="ghost"
                onClick={() => { setPreview(null); setFileName(null); if (fileRef.current) fileRef.current.value = '' }}
              >
                Anuluj
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Import history */}
      <div className="bg-white rounded-xl border">
        <div className="p-5 border-b">
          <h2 className="font-semibold text-gray-900">Historia importów</h2>
        </div>
        <div className="divide-y">
          {importLogs.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">Brak historii importów</div>
          )}
          {importLogs.map(log => (
            <div key={log.id}>
              <button
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
              >
                <div className="flex items-center gap-3">
                  <StatusIcon status={log.status} />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {log.import_type === 'products' ? 'Import produktów' : 'Aktualizacja stanów'}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatDateTime(log.created_at)} · {log.success_rows}/{log.total_rows} wierszy
                      {log.error_rows > 0 && ` · ${log.error_rows} błędów`}
                    </div>
                  </div>
                </div>
                <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                  log.status === 'success' ? 'bg-green-100 text-green-700'
                  : log.status === 'error' ? 'bg-red-100 text-red-700'
                  : log.status === 'partial' ? 'bg-orange-100 text-orange-700'
                  : 'bg-gray-100 text-gray-600'
                }`}>
                  {log.status === 'success' ? 'Sukces'
                    : log.status === 'error' ? 'Błąd'
                    : log.status === 'partial' ? 'Częściowy'
                    : 'W toku'}
                </div>
              </button>
              {expandedLog === log.id && log.error_details && log.error_details.length > 0 && (
                <div className="px-4 pb-4 bg-red-50">
                  <div className="text-xs text-red-700 font-medium mb-1">Błędy:</div>
                  <ul className="text-xs text-red-600 space-y-0.5">
                    {log.error_details.map((e, i) => <li key={i}>· {e}</li>)}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
