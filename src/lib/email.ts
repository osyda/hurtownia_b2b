import { Resend } from 'resend'

const DEFAULT_FROM = 'Dostawio <noreply@mail.dostawio.pl>'
const FROM = process.env.DOSTAWIO_EMAIL_FROM || DEFAULT_FROM
const REPLY_TO = process.env.DOSTAWIO_EMAIL_REPLY_TO || undefined
const APP_URL = 'https://dostawio.pl'

let resendClient: Resend | null | undefined

type EmailSendResult =
  | { ok: true; id: string | null }
  | { ok: false; reason: 'not_configured' | 'provider_error'; error?: string }

interface SendEmailInput {
  to: string
  subject: string
  preview: string
  html: string
  text: string
  idempotencyKey: string
  tag: string
}

function getResend(): Resend | null {
  if (!process.env.DOSTAWIO_RESEND_API_KEY) return null
  if (resendClient === undefined) {
    resendClient = new Resend(process.env.DOSTAWIO_RESEND_API_KEY)
  }
  return resendClient
}

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value)
}

function button(label: string, href: string) {
  return `
    <a href="${escapeHtml(href)}" style="display:inline-block;background:#1D2125;color:#ffffff;padding:13px 20px;border-radius:8px;text-decoration:none;font-weight:800;font-size:14px">
      ${escapeHtml(label)}
    </a>
  `
}

function row(label: string, value: string | number) {
  return `
    <tr>
      <td style="padding:10px 0;color:#64748b;font-size:14px">${escapeHtml(label)}</td>
      <td style="padding:10px 0;color:#1D2125;font-size:14px;font-weight:800;text-align:right">${escapeHtml(value)}</td>
    </tr>
  `
}

function normalizeIdempotencyKey(value: string) {
  const normalized = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9:._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 220)

  return normalized || `email:${Date.now()}`
}

function renderEmail({
  preview,
  title,
  intro,
  body,
  action,
}: {
  preview: string
  title: string
  intro?: string
  body: string
  action?: string
}) {
  return `
    <!doctype html>
    <html lang="pl">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${escapeHtml(preview)}</title>
      </head>
      <body style="margin:0;background:#F4F1EC;padding:28px 16px;font-family:Arial,Helvetica,sans-serif;color:#1D2125">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preview)}</div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto">
          <tr>
            <td>
              <div style="background:#1D2125;color:#ffffff;border-radius:14px 14px 0 0;padding:24px">
                <div style="display:inline-block;width:42px;height:42px;line-height:42px;text-align:center;border-radius:10px;background:#ffffff;color:#1D2125;font-weight:900">D</div>
                <div style="margin-top:18px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#94a3b8;font-weight:800">Dostawio</div>
                <h1 style="margin:8px 0 0;font-size:26px;line-height:1.15;color:#ffffff">${escapeHtml(title)}</h1>
                ${intro ? `<p style="margin:12px 0 0;color:#cbd5e1;line-height:1.65;font-size:15px">${escapeHtml(intro)}</p>` : ''}
              </div>
              <div style="background:#ffffff;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 14px 14px;padding:24px">
                ${body}
                ${action ? `<div style="margin-top:22px">${action}</div>` : ''}
                <div style="margin-top:26px;border-top:1px solid #e2e8f0;padding-top:18px;color:#94a3b8;font-size:12px;line-height:1.6">
                  Wiadomość wysłana automatycznie przez Dostawio. Panel platformy: ${escapeHtml(APP_URL)}
                </div>
              </div>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `
}

async function sendTransactionalEmail(input: SendEmailInput): Promise<EmailSendResult> {
  try {
    const resend = getResend()
    if (!resend) {
      console.info(`[email:${input.tag}] DOSTAWIO_RESEND_API_KEY is not configured; email skipped.`)
      return { ok: false, reason: 'not_configured' }
    }

    const payload = {
      from: FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      tags: [{ name: 'type', value: input.tag }],
      ...(REPLY_TO ? { replyTo: REPLY_TO } : {}),
    }

    const { data, error } = await resend.emails.send(payload, {
      idempotencyKey: normalizeIdempotencyKey(input.idempotencyKey),
    })

    if (error) {
      console.error(`[email:${input.tag}] Resend error`, error)
      return { ok: false, reason: 'provider_error', error: error.message }
    }

    return { ok: true, id: data?.id ?? null }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown email provider error'
    console.error(`[email:${input.tag}] Resend exception`, error)
    return { ok: false, reason: 'provider_error', error: message }
  }
}

export async function sendTenantAdminWelcomeEmail({
  adminEmail,
  adminName,
  tenantName,
  panelUrl,
  shopUrl,
}: {
  adminEmail: string
  adminName: string
  tenantName: string
  panelUrl: string
  shopUrl: string
}) {
  const subject = `Dostęp do panelu Dostawio - ${tenantName}`
  const preview = `${tenantName} ma już panel hurtowni i sklep klienta w Dostawio.`
  const html = renderEmail({
    preview,
    title: 'Panel hurtowni jest gotowy',
    intro: `Cześć ${adminName}, Twoje konto administratora dla ${tenantName} zostało utworzone.`,
    body: `
      <p style="margin:0 0 16px;color:#334155;line-height:1.65;font-size:15px">
        Możesz zalogować się do panelu, uzupełnić dane firmy, płatności, dostawy, produkty i klientów.
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;margin:18px 0">
        ${row('Hurtownia', tenantName)}
        ${row('Panel hurtowni', panelUrl)}
        ${row('Sklep klienta', shopUrl)}
      </table>
      <p style="margin:0;color:#64748b;line-height:1.65;font-size:14px">
        Hasło tymczasowe przekaże operator Dostawio. W kolejnym kroku uruchomimy bezpieczne ustawianie hasła przez link.
      </p>
    `,
    action: button('Otwórz panel hurtowni', panelUrl),
  })

  return sendTransactionalEmail({
    to: adminEmail,
    subject,
    preview,
    html,
    text: [
      `Cześć ${adminName},`,
      `Panel hurtowni ${tenantName} jest gotowy.`,
      `Panel: ${panelUrl}`,
      `Sklep klienta: ${shopUrl}`,
      'Hasło tymczasowe przekaże operator Dostawio.',
    ].join('\n'),
    idempotencyKey: `tenant-admin-welcome:${tenantName}:${adminEmail}`,
    tag: 'tenant_admin_welcome',
  })
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
  const amount = formatCurrency(totalGross)
  const subject = `Nowe zamówienie ${orderNumber} od ${customerName}`
  const preview = `Nowe zamówienie B2B w ${tenantName}: ${amount}.`
  const html = renderEmail({
    preview,
    title: 'Nowe zamówienie B2B',
    intro: `${tenantName} otrzymała nowe zamówienie wymagające obsługi.`,
    body: `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0">
        ${row('Numer zamówienia', orderNumber)}
        ${row('Klient', customerName)}
        ${row('Wartość brutto', amount)}
      </table>
    `,
    action: button('Przejdź do zamówienia', orderUrl),
  })

  return sendTransactionalEmail({
    to: tenantEmail,
    subject,
    preview,
    html,
    text: [
      `Nowe zamówienie - ${tenantName}`,
      `Numer: ${orderNumber}`,
      `Klient: ${customerName}`,
      `Wartość brutto: ${amount}`,
      `Szczegóły: ${orderUrl}`,
    ].join('\n'),
    idempotencyKey: `new-order:${orderNumber}:${tenantEmail}`,
    tag: 'new_order',
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
  const amount = formatCurrency(totalGross)
  const subject = status === 'confirmed'
    ? `Zamówienie ${orderNumber} potwierdzone`
    : status === 'cancelled'
      ? `Zamówienie ${orderNumber} anulowane`
      : `Aktualizacja zamówienia ${orderNumber} - ${statusLabel}`

  const preview = `Status zamówienia ${orderNumber}: ${statusLabel}.`
  const html = renderEmail({
    preview,
    title: 'Aktualizacja zamówienia',
    intro: `Cześć ${customerName}, status Twojego zamówienia został zaktualizowany.`,
    body: `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0">
        ${row('Numer zamówienia', orderNumber)}
        ${row('Status', statusLabel)}
        ${row('Wartość brutto', amount)}
      </table>
      ${note ? `<div style="margin-top:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;color:#475569;font-size:14px;line-height:1.6"><strong>Uwaga:</strong> ${escapeHtml(note)}</div>` : ''}
    `,
    action: button('Zobacz szczegóły zamówienia', orderUrl),
  })

  return sendTransactionalEmail({
    to: customerEmail,
    subject,
    preview,
    html,
    text: [
      `Cześć ${customerName},`,
      `Status zamówienia ${orderNumber}: ${statusLabel}`,
      `Wartość brutto: ${amount}`,
      note ? `Uwaga: ${note}` : '',
      `Szczegóły: ${orderUrl}`,
    ].filter(Boolean).join('\n'),
    idempotencyKey: `order-status:${orderNumber}:${status}:${customerEmail}`,
    tag: 'order_status',
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
  const subject = `Zaproszenie do platformy B2B - ${tenantName}`
  const preview = `${tenantName} zaprasza Cię do składania zamówień online.`
  const html = renderEmail({
    preview,
    title: 'Zaproszenie do sklepu B2B',
    intro: `Cześć ${customerName}, ${tenantName} zaprasza Cię do korzystania z platformy Dostawio.`,
    body: `
      <p style="margin:0 0 16px;color:#334155;line-height:1.65;font-size:15px">
        Po zalogowaniu możesz przeglądać katalog, wybierać przypisane formy płatności, składać zamówienia i śledzić ich status.
      </p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;color:#475569;font-size:14px;line-height:1.6">
        Jeśli nie znasz hasła, skontaktuj się z hurtownią lub operatorem Dostawio.
      </div>
    `,
    action: button('Zaloguj się do sklepu B2B', loginUrl),
  })

  return sendTransactionalEmail({
    to: customerEmail,
    subject,
    preview,
    html,
    text: [
      `Cześć ${customerName},`,
      `${tenantName} zaprasza Cię do korzystania z platformy Dostawio.`,
      `Logowanie: ${loginUrl}`,
    ].join('\n'),
    idempotencyKey: `customer-invite:${tenantName}:${customerEmail}`,
    tag: 'customer_invite',
  })
}

export async function sendDemoRequestEmail({
  company,
  nip,
  name,
  email,
  phone,
  message,
}: {
  company: string
  nip: string
  name: string
  email: string
  phone: string
  message?: string
}) {
  const to = process.env.DOSTAWIO_DEMO_REQUEST_TO || 'kontakt@dostawio.pl'
  const subject = `Nowa prośba o demo Dostawio - ${company}`
  const preview = `${name} z ${company} prosi o dostęp demo.`
  const html = renderEmail({
    preview,
    title: 'Nowa prośba o demo',
    intro: `${name} chce otrzymać dostęp demo do Dostawio Connect.`,
    body: `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0">
        ${row('Hurtownia', company)}
        ${row('NIP hurtowni', nip)}
        ${row('Osoba kontaktowa', name)}
        ${row('E-mail', email)}
        ${row('Telefon', phone)}
      </table>
      ${message ? `<div style="margin-top:16px;background:#F4F1EC;border:1px solid #E2DCD0;border-radius:8px;padding:12px;color:#475569;font-size:14px;line-height:1.6"><strong>Wiadomość:</strong><br>${escapeHtml(message)}</div>` : ''}
    `,
    action: button('Odpisz na e-mail', `mailto:${email}`),
  })

  return sendTransactionalEmail({
    to,
    subject,
    preview,
    html,
    text: [
      'Nowa prośba o demo Dostawio Connect',
      `Hurtownia: ${company}`,
      `NIP: ${nip}`,
      `Osoba: ${name}`,
      `E-mail: ${email}`,
      `Telefon: ${phone}`,
      message ? `Wiadomość: ${message}` : '',
    ].filter(Boolean).join('\n'),
    idempotencyKey: `demo-request:${email}:${nip}:${company}`,
    tag: 'demo_request',
  })
}
