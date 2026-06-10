'use server'

import { z } from 'zod'
import { sendDemoRequestEmail } from '@/lib/email'

const demoRequestSchema = z.object({
  company: z.string().min(2, 'Podaj nazwę hurtowni.'),
  name: z.string().min(2, 'Podaj imię i nazwisko.'),
  email: z.string().email('Podaj poprawny adres e-mail.'),
  phone: z.string().min(5, 'Podaj numer telefonu.'),
  message: z.string().max(1200).optional(),
})

export type DemoRequestState = {
  error?: string
  success?: string
}

export async function requestDemoAction(_: DemoRequestState, formData: FormData): Promise<DemoRequestState> {
  const parsed = demoRequestSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  try {
    const result = await sendDemoRequestEmail(parsed.data)
    if (result.ok) {
      return {
        success: 'Dziękuję. Odezwę się z dostępem demo po krótkiej weryfikacji hurtowni.',
      }
    }

    console.error('[demo-request] Email send failed', result)
    return { error: 'Nie udało się wysłać formularza. Napisz bezpośrednio na kontakt@dostawio.pl.' }
  } catch (error) {
    console.error('[demo-request] Unexpected error', error)
    return { error: 'Nie udało się wysłać formularza. Napisz bezpośrednio na kontakt@dostawio.pl.' }
  }
}
