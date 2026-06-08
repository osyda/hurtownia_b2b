import { Resend } from 'resend'

const FROM = process.env.RESEND_FROM || 'Dostawio <noreply@dostawio.pl>'

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  return new Resend(process.env.RESEND_API_KEY)
}

export async function sendNewOrderEmail({
  tenantEmail,
  tenantName,
  orderNumber,
  customerName,
  totalGross,
  orderUrl,
}: {
  tenantEmail: string
  tenantName: string
  orderNumber: string
  customerName: string
  totalGross: number
  orderUrl: string
}) {
  const resend = getResend()
  if (!resend) return

  const amount = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(totalGross)

  await resend.emails.send({
    from: FROM,
    to: tenantEmail,
    subject: `Nowe zamówienie ${orderNumber} od ${customerName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#1e293b">Nowe zamówienie - ${tenantName}</h2>
        <p>Wpłynęło nowe zamówienie wymagające potwierdzenia.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px 0;color:#64748b">Numer zamówienia:</td><td style="font-weight:bold">${orderNumber}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b">Klient:</td><td>${customerName}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b">Wartość brutto:</td><td style="font-weight:bold">${amount}</td></tr>
        </table>
        <a href="${orderUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:500">
          Przejdź do zamówienia
        </a>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px">Wiadomość wysłana automatycznie przez Dostawio</p>
      </div>
    `,
  })
}

export async function sendOrderStatusEmail({
  customerEmail,
  customerName,
  orderNumber,
  status,
  statusLabel,
  totalGross,
  orderUrl,
  note,
}: {
  customerEmail: string
  customerName: string
  orderNumber: string
  status: string
  statusLabel: string
  totalGross: number
  orderUrl: string
  note?: string
}) {
  const resend = getResend()
  if (!resend) return

  const amount = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(totalGross)
  const subject = status === 'confirmed'
    ? `Zamówienie ${orderNumber} potwierdzone`
    : status === 'cancelled'
      ? `Zamówienie ${orderNumber} anulowane`
      : `Aktualizacja zamówienia ${orderNumber} - ${statusLabel}`

  await resend.emails.send({
    from: FROM,
    to: customerEmail,
    subject,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#1e293b">Aktualizacja zamówienia</h2>
        <p>Cześć ${customerName},</p>
        <p>Status Twojego zamówienia zmienił się na: <strong>${statusLabel}</strong></p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px 0;color:#64748b">Numer zamówienia:</td><td style="font-weight:bold">${orderNumber}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b">Status:</td><td><strong>${statusLabel}</strong></td></tr>
          <tr><td style="padding:8px 0;color:#64748b">Wartość brutto:</td><td>${amount}</td></tr>
        </table>
        ${note ? `<p style="background:#f1f5f9;padding:12px;border-radius:8px;color:#475569"><strong>Uwaga:</strong> ${note}</p>` : ''}
        <a href="${orderUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:500">
          Szczegóły zamówienia
        </a>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px">Wiadomość wysłana automatycznie przez Dostawio</p>
      </div>
    `,
  })
}

export async function sendCustomerInviteEmail({
  customerEmail,
  customerName,
  tenantName,
  loginUrl,
}: {
  customerEmail: string
  customerName: string
  tenantName: string
  loginUrl: string
}) {
  const resend = getResend()
  if (!resend) return

  await resend.emails.send({
    from: FROM,
    to: customerEmail,
    subject: `Zaproszenie do platformy B2B - ${tenantName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#1e293b">Zaproszenie do platformy B2B</h2>
        <p>Cześć ${customerName},</p>
        <p><strong>${tenantName}</strong> zaprasza Cię do korzystania z platformy zamówień B2B.</p>
        <p>Możesz teraz składać zamówienia online, przeglądać historię i śledzić ich status.</p>
        <a href="${loginUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:500">
          Zaloguj się do platformy
        </a>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px">Wiadomość wysłana automatycznie przez Dostawio</p>
      </div>
    `,
  })
}
