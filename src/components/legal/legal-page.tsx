import Link from 'next/link'
import { DostawioLogo } from '@/components/brand/dostawio-logo'
import { legalCompany } from '@/lib/legal'

export function LegalPageShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <main className="min-h-screen bg-[#FBFAF7] text-[#1D2125]">
      <header className="border-b border-[#E2DCD0]/80 bg-white">
        <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
          <Link href="/" aria-label="Dostawio - strona główna">
            <DostawioLogo className="w-[180px]" />
          </Link>
          <Link href="/" className="rounded-lg border border-[#E2DCD0] bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-[#F8F5EF]">
            Wróć
          </Link>
        </nav>
      </header>

      <section className="px-5 py-10 sm:py-14">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-xl border border-[#E2DCD0] bg-white p-5 shadow-sm sm:p-8">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0F5B41]">{eyebrow}</div>
            <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              {title}
            </h1>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              {description}
            </p>
            <div className="mt-6 rounded-lg border border-[#E2DCD0] bg-[#FBFAF7] p-4 text-sm leading-7 text-slate-600">
              <div><span className="font-semibold text-slate-900">Administrator / usługodawca:</span> {legalCompany.owner}</div>
              <div><span className="font-semibold text-slate-900">Forma:</span> {legalCompany.legalForm}</div>
              <div><span className="font-semibold text-slate-900">Adres:</span> {legalCompany.address}</div>
              <div><span className="font-semibold text-slate-900">Kontakt:</span> <a href={`mailto:${legalCompany.email}`} className="font-semibold underline-offset-4 hover:underline">{legalCompany.email}</a></div>
              <div><span className="font-semibold text-slate-900">Data obowiązywania:</span> {legalCompany.effectiveDate}</div>
            </div>
          </div>

          <article className="legal-content mt-6 rounded-xl border border-[#E2DCD0] bg-white p-5 shadow-sm sm:p-8">
            {children}
          </article>
        </div>
      </section>
    </main>
  )
}

