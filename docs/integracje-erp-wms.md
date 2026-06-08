# Integracje ERP/WMS dla hurtowni B2B

## Cel

Portal B2B ma być neutralną warstwą zamówień. Hurtownia może korzystać z Subiekta, Comarch, enova365, Symfonii, Wapro, BaseLinkera albo własnego systemu. Portal udostępnia jedno API, a po stronie klienta działa konektor/middleware dopasowany do konkretnego ERP.

## Systemy priorytetowe w Polsce

1. InsERT Subiekt GT / Subiekt nexo
   - Popularny w małych i średnich firmach handlowo-magazynowych.
   - Integracje zwykle idą przez Sferę GT / Sferę nexo albo lokalny serwis Windows przy bazie klienta.

2. Comarch ERP Optima / Comarch ERP XL
   - Optima jest częsta w MŚP, XL w większych organizacjach.
   - Optima często wymaga konektora/warstwy API po stronie klienta; XL ma własne mechanizmy API.

3. enova365
   - Dobra kandydatura do bezpośrednich integracji, jeżeli klient ma aktywny moduł API.

4. Symfonia ERP Handel
   - Integracja zwykle przez WebAPI/usługę działającą przy instalacji klienta.

5. Wapro MAG
   - Wymaga sprawdzenia dostępnego modułu API albo konektora partnera.

6. BaseLinker
   - Najszybszy pomost, jeśli klient już ma BaseLinkera między ERP, magazynem i kanałami sprzedaży.

## Rekomendowany przepływ

1. Klient B2B składa zamówienie w portalu.
2. Konektor ERP pobiera zamówienie z:

```http
GET /api/integrations/v1/orders
Authorization: Bearer <TOKEN>
```

3. Konektor tworzy dokument w ERP:
   - ZK / rezerwacja / zamówienie od klienta,
   - opcjonalnie WZ,
   - finalnie faktura sprzedaży.

4. Po wystawieniu faktury konektor odsyła dane do portalu:

```http
POST /api/integrations/v1/orders/{orderId}/invoice
Authorization: Bearer <TOKEN>
Content-Type: application/json
```

```json
{
  "external_invoice_id": "FS-12345",
  "invoice_number": "FV/2026/06/001",
  "invoice_type": "invoice",
  "invoice_date": "2026-06-08",
  "sale_date": "2026-06-08",
  "due_date": "2026-06-22",
  "payment_method_label": "Przelew 14 dni",
  "payment_status": "unpaid",
  "currency": "PLN",
  "total_net": 1000,
  "total_vat": 230,
  "total_gross": 1230,
  "pdf_url": "https://erp-klienta.pl/faktury/FV-2026-06-001.pdf"
}
```

5. Faktura pojawia się w szczegółach zamówienia w panelu hurtowni i klienta.

## Konfiguracja w panelu

1. Wejdź w panel hurtowni.
2. Otwórz `Integracje`.
3. Wybierz system klienta, np. `InsERT Subiekt`, `Comarch ERP Optima`, `enova365`, `BaseLinker`.
4. Uzupełnij:
   - adres bazowy ERP/middleware,
   - ID magazynu w ERP,
   - ID cennika w ERP,
   - notatki wdrożeniowe.
5. Zapisz konfigurację.
6. Kliknij `Wygeneruj nowy token`.
7. Skopiuj token i przekaż go integratorowi klienta. Token jest widoczny tylko raz.

## Minimalne mapowanie danych

### Zamówienie z portalu do ERP

- `order_number` -> numer obcy / numer zamówienia w ERP
- `customer.nip` -> identyfikacja kontrahenta
- `customer.email` -> fallback identyfikacji kontrahenta
- `payment_methods.label` -> forma płatności
- `delivery_address` -> adres dostawy
- `order_items.product_sku` -> kod towaru w ERP
- `ordered_qty` -> ilość
- `unit_price_net` -> cena netto
- `vat_rate` -> stawka VAT

### Faktura z ERP do portalu

- numer faktury
- data wystawienia
- termin płatności
- status płatności
- wartość netto/VAT/brutto
- link do PDF albo ścieżka w storage
- zewnętrzne ID dokumentu ERP

## Ważne założenia bezpieczeństwa

- Nie zapisujemy jawnego tokena API w bazie, tylko jego hash.
- Token można rotować per hurtownia.
- Konektor powinien działać po stronie klienta lub partnera wdrożeniowego.
- Jeżeli ERP działa lokalnie w sieci klienta, nie wystawiamy bazy ERP do internetu; wystawiamy tylko mały konektor HTTPS.
- Dla plików PDF z fakturami najlepszy docelowy wariant to prywatny Supabase Storage + podpisane linki czasowe.

## Priorytet wdrożenia

1. BaseLinker, jeśli klient już go ma.
2. InsERT Subiekt GT / nexo przez Sferę lub konektor partnera.
3. Comarch Optima przez warstwę API/konektor.
4. enova365 przez moduł API.
5. Symfonia/Wapro przez WebAPI lub konektor partnera.
