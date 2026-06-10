'use server'

import { z } from 'zod'
import { sendDemoConfirmationEmail, sendDemoRequestEmail } from '@/lib/email'

const demoRequestSchema = z.object({
  company: z.string().min(2, 'Podaj nazwę hurtowni.'),
  nip: z.string()
    .min(10, 'Podaj NIP hurtowni.')
    .regex(/^[0-9\s-]+$/, 'NIP może zawierać tylko cyfry, spacje i myślniki.')
    .transform(value => value.replace(/\D/g, ''))
    .refine(value => value.length === 10, 'NIP musi mieć 10 cyfr.'),
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
      const confirmation = await sendDemoConfirmationEmail(parsed.data)
      if (!confirmation.ok) {
        console.error('[demo-request] Confirmation email failed', confirmation)
      }

      return {
        success: confirmation.ok
          ? 'Dziękuję. Zgłoszenie dotarło, a potwierdzenie wysłaliśmy na podany e-mail.'
          : 'Dziękuję. Zgłoszenie dotarło, ale potwierdzenie e-mail nie zostało wysłane automatycznie.',
      }
    }

    console.error('[demo-request] Email send failed', result)
    return { error: 'Nie udało się wysłać formularza. Napisz bezpośrednio na kontakt@dostawio.pl.' }
  } catch (error) {
    console.error('[demo-request] Unexpected error', error)
    return { error: 'Nie udało się wysłać formularza. Napisz bezpośrednio na kontakt@dostawio.pl.' }
  }
}
