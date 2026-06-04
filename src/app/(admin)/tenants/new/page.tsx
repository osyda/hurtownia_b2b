'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { createTenant } from '@/app/actions/admin'
import { slugify } from '@/lib/utils'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NewTenantPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManual, setSlugManual] = useState(false)
  const [brandColor, setBrandColor] = useState('#2563eb')

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setName(e.target.value)
    if (!slugManual) setSlug(slugify(e.target.value))
  }

  function handleSubmit(formData: FormData) {
    formData.set('slug', slug)
    formData.set('brand_color', brandColor)
    startTransition(async () => {
      const res = await createTenant(formData)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success('Hurtownia utworzona')
        router.push('/tenants')
      }
    })
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <Link href="/tenants" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="h-4 w-4" />
        Powrót do listy
      </Link>
      <PageHeader title="Nowa hurtownia" description="Utwórz nową hurtownię i konto administratora" />

      <form action={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 text-sm">Dane hurtowni</h2>
          <Input
            label="Nazwa hurtowni"
            name="name"
            value={name}
            onChange={handleNameChange}
            required
            placeholder="np. Hurtownia Kowalski"
          />
          <div>
            <Input
              label="Slug (adres URL)"
              name="slug"
              value={slug}
              onChange={e => { setSlug(e.target.value); setSlugManual(true) }}
              required
              placeholder="np. kowalski"
              hint={`Adres panelu: /sklep/${slug || 'slug'}`}
            />
          </div>
          <Input
            label="E-mail kontaktowy (do powiadomień)"
            name="contact_email"
            type="email"
            placeholder="biuro@hurtownia.pl"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kolor marki</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={brandColor}
                onChange={e => setBrandColor(e.target.value)}
                className="h-10 w-16 rounded-lg border border-gray-300 cursor-pointer"
              />
              <span className="text-sm text-gray-500 font-mono">{brandColor}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 text-sm">Konto administratora hurtowni</h2>
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
            label="Hasło (min. 8 znaków)"
            name="password"
            type="password"
            required
            placeholder="••••••••"
          />
        </div>

        <div className="flex gap-3">
          <Button type="submit" loading={isPending}>Utwórz hurtownię</Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>Anuluj</Button>
        </div>
      </form>
    </div>
  )
}
