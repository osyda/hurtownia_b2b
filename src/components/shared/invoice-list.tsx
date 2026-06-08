import { FileText } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { OrderInvoice } from '@/types/database.types'

interface Props {
  invoices: OrderInvoice[]
}

const TYPE_LABELS: Record<OrderInvoice['invoice_type'], string> = {
  invoice: 'Faktura',
  correction: 'Korekta',
  proforma: 'Pro forma',
  receipt: 'Paragon',
}

export function InvoiceList({ invoices }: Props) {
  if (!invoices.length) return null

  return (
    <section className="premium-card overflow-hidden">
      <div className="border-b border-slate-200/80 bg-white px-4 py-3">
        <h2 className="font-black text-slate-950">Dokumenty sprzedaży</h2>
        <p className="text-sm text-slate-500">Faktury i dokumenty odeslane z systemu ERP.</p>
      </div>
      <div className="divide-y divide-slate-100">
        {invoices.map(invoice => (
          <div key={invoice.id} className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center">
            <div className="flex min-w-0 gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="font-mono text-sm font-black text-slate-950">{invoice.invoice_number}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {TYPE_LABELS[invoice.invoice_type]}{invoice.invoice_date ? ` · ${formatDate(invoice.invoice_date)}` : ''}
                  {invoice.due_date ? ` · termin ${formatDate(invoice.due_date)}` : ''}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 md:justify-end">
              {invoice.total_gross !== null && (
                <div className="text-sm font-black text-slate-950">{formatCurrency(invoice.total_gross)}</div>
              )}
              {invoice.pdf_url && (
                <a
                  href={invoice.pdf_url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  Pobierz PDF
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
