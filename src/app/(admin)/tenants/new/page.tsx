'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ExternalLink, Globe2, KeyRound, Store } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import { createTenant } from '@/app/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { getTenantPanelUrl, getTenantShopUrl, isReservedTenantSlug } from '@/lib/shop-routing'
import { slugify } from '@/lib/utils'

export default function NewTenantPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManual, setSlugManual] = useState(false)
  const [brandColor, setBrandColor] = useState('#2563eb')

  const previewSlug = slug || 'nowa-hurtownia'
  const shopUrl = getTenantShopUrl(previewSlug)
  const panelUrl = getTenantPanelUrl(previewSlug)
  const slugReserved = slug ? isReservedTenantSlug(slug) : false

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setName(e.target.value)
    if (!slugManual) setSlug(slugify(e.target.value))
  }

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSlug(slugify(e.target.value))
    setSlugManual(true)
  }

  function handleSubmit(formData: FormData) {
    if (slugReserved) {
      toast.error('Ten slug jest zarezerwowany dla platformy Dostawio.')
      return
    }

    formData.set('slug', slug)
    formData.set('brand_color', brandColor)

    startTransition(async () => {
      const res = await createTenant(formData)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success('Hurtownia utworzona z panelem, sklepem i domyślnymi formami płatności.')
        router.push(`/tenants/${res.tenantId}`)
      }
    })
  }

  return (
    <div className="max-w-6xl p-4 md:p-8">
      <Link href="/tenants" className="mb-4 flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" />
        Powrót do listy
      </Link>

      <PageHeader
        title="Nowa hurtownia"
        description="Utwórz konto hurtowni, administratora oraz gotowy sklep klienta na subdomenie Dostawio."
      />

      <form action={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_0.72fr]">
        <div className="space-y-6">
          <div className="premium-card space-y-4 p-5">
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-400">Dane hurtowni</h2>
              <p className="mt-1 text-sm text-slate-500">Te informacje tworzą konto firmy i jej publiczny adres sklepu.</p>
            </div>

            <Input
              label="Nazwa hurtowni"
              name="name"
              value={name}
              onChange={handleNameChange}
              required
              placeholder="np. Hurtownia Kowalski"
            />

            <Input
              label="Slug hurtowni"
              name="slug"
              value={slug}
              onChange={handleSlugChange}
              required
              placeholder="np. kowalski"
              error={slugReserved ? 'Ten slug jest zarezerwowany dla platformy.' : undefined}
              hint="Slug tworzy adres sklepu klienta i ścieżkę panelu hurtowni."
            />

            <Input
              label="E-mail kontaktowy i powiadomień"
              name="contact_email"
              type="email"
              placeholder="biuro@hurtownia.pl"
              hint="Na ten adres mogą trafiać powiadomienia o nowych zamówieniach."
            />

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Kolor marki</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={brandColor}
                  onChange={e => setBrandColor(e.target.value)}
                  className="h-10 w-16 cursor-pointer rounded-lg border border-slate-300"
                />
                <span className="font-mono text-sm text-slate-500">{brandColor}</span>
              </div>
            </div>
          </div>

          <div className="premium-card space-y-4 p-5">
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-400">Administrator hurtowni</h2>
              <p className="mt-1 text-sm text-slate-500">Ta osoba dostaje dostęp do panelu swojej firmy.</p>
            </div>

            <Input
              label="Imię i nazwisko"
              name="full_name"
              required
              placeholder="Jan Kowalski"
            />
            <Input
              label="E-mail administratora"
              name="email"
              type="email"
              required
              placeholder="admin@hurtownia.pl"
            />
            <Input
              label="Hasło tymczasowe"
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="minimum 8 znaków"
              hint="Po starcie można wymusić zmianę hasła w kolejnym etapie onboardingu."
            />
          </div>
        </div>

        <aside className="space-y-4">
          <div className="premium-card overflow-hidden">
            <div className="border-b border-slate-200/80 bg-slate-950 px-5 py-4 text-white">
              <div className="text-sm font-black">Podgląd wdrożenia</div>
              <p className="mt-1 text-xs leading-5 text-slate-400">Adresy powstaną automatycznie po utworzeniu hurtowni.</p>
            </div>
            <div className="space-y-4 p-5">
              <PreviewLink icon={Store} label="Sklep klienta" url={shopUrl} />
              <PreviewLink icon={Globe2} label="Panel hurtowni" url={panelUrl} />
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold leading-6 text-emerald-800">
                System doda też domyślne metody płatności: przelew 7/14/30 dni i gotówkę przy dostawie.
              </div>
            </div>
          </div>

          <div className="premium-card p-5">
            <KeyRound className="mb-5 h-5 w-5 text-slate-500" />
            <h2 className="text-lg font-black tracking-tight text-slate-950">Model dostępu</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Ty widzisz wszystkie hurtownie jako superadmin. Hurtownia widzi tylko swoje dane.
              Klient trafia do sklepu przypisanego do swojej hurtowni.
            </p>
          </div>

          <div className="flex gap-3">
            <Button type="submit" loading={isPending} className="flex-1">
              Utwórz hurtownię
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              Anuluj
            </Button>
          </div>
        </aside>
      </form>
    </div>
  )
}

function PreviewLink({
  icon: Icon,
  label,
  url,
}: {
  icon: LucideIcon
  label: string
  url: string
}) {
  return (
    <a href={url} target="_blank" rel="noreferrer" className="block rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-black text-slate-950">
          <Icon className="h-4 w-4 text-slate-500" />
          {label}
        </div>
        <ExternalLink className="h-4 w-4 text-slate-400" />
      </div>
      <div className="break-all font-mono text-xs font-bold text-sky-700">{url}</div>
    </a>
  )
}
