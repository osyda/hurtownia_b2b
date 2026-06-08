# Resend dla Dostawio

Ten projekt nie korzysta z konfiguracji e-mail HaccPro. Dostawio ma osobne zmienne i osobną domenę wysyłkową.

## Zmienne Vercel

Dodaj tylko w projekcie Vercel `hurtownia-b2b`:

```env
DOSTAWIO_RESEND_API_KEY=re_...
DOSTAWIO_EMAIL_FROM="Dostawio <noreply@mail.dostawio.pl>"
DOSTAWIO_EMAIL_REPLY_TO=kontakt@dostawio.pl
```

Nie używamy tutaj globalnego `RESEND_API_KEY`, żeby nie mieszać tego z HaccPro.

## Domena wysyłkowa

Rekomendowana domena wysyłkowa:

```text
mail.dostawio.pl
```

W Resend dodaj domenę `mail.dostawio.pl`, a następnie w DNS dodaj rekordy pokazane przez Resend:

- SPF/TXT,
- DKIM/CNAME,
- MX, jeżeli Resend go wymaga dla konfiguracji,
- opcjonalnie tracking CNAME,
- DMARC dla domeny lub subdomeny.

## Maile obsługiwane w aplikacji

Aktualnie aplikacja wysyła:

- powitanie administratora hurtowni po utworzeniu firmy,
- zaproszenie klienta B2B,
- powiadomienie hurtowni o nowym zamówieniu,
- aktualizację statusu zamówienia do klienta.

Jeżeli `DOSTAWIO_RESEND_API_KEY` nie jest ustawiony, aplikacja nie wysyła maila, ale proces biznesowy działa dalej.

## Zasada docelowa

Kod ma własną warstwę e-maili w `src/lib/email.ts`. Dzięki temu później można dodać adapter Amazon SES, Postmark albo Mailgun bez przepisywania akcji zamówień i klientów.
