'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { inviteCustomerUser } from '@/app/actions/admin'
import { Mail, X } from 'lucide-react'

export function InviteCustomerButton({
  tenantSlug,
  customerId,
  customerEmail,
}: {
  tenantSlug: string
  customerId: string
  customerEmail: string
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    const email = String(formData.get('email'))
    const password = String(formData.get('password'))
    startTransition(async () => {
      const res = await inviteCustomerUser(tenantSlug, customerId, email, password)
      if (res?.error) toast.error(res.error)
      else {
        toast.success('Konto utworzone — klient może się teraz zalogować')
        setOpen(false)
      }
    })
  }

  if (!open) {
    return (
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <Mail className="h-4 w-4" />
        Zaproś do platformy
      </Button>
    )
  }

  return (
    <div className="relative bg-white border rounded-xl shadow-lg p-5 w-80 z-10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm text-gray-900">Utwórz konto klienta</h3>
        <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>
      <form action={handleSubmit} className="space-y-3">
        <Input
          label="E-mail logowania"
          name="email"
          type="email"
          defaultValue={customerEmail}
          required
        />
        <Input
          label="Hasło tymczasowe (min. 8 znaków)"
          name="password"
          type="password"
          required
          hint="Klient powinien zmienić po pierwszym logowaniu"
        />
        <Button type="submit" size="sm" loading={isPending} className="w-full">
          Utwórz konto i wyślij zaproszenie
        </Button>
      </form>
    </div>
  )
}
