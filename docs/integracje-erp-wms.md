# Integracje ERP/WMS dla Dostawio

## Cel

Dostawio ma być neutralną warstwą zamówień B2B. Hurtownia może pracować na Subiekcie, Comarchu, enova365, Symfonii, Wapro, BaseLinkerze/Base albo własnym systemie. Platforma udostępnia jedno API, a po stronie hurtowni działa konektor dopasowany do konkretnego ERP/WMS.

## Rekomendowana architektura

1. Klient B2B składa zamówienie na subdomenie hurtowni, np. `hurtownia.dostawio.pl`.
2. Konektor ERP/WMS po stronie hurtowni pobiera zamówienia z API Dostawio.
3. ERP tworzy dokument handlowy, np. ZK, WZ albo FV.
4. Po wystawieniu faktury konektor odsyła numer faktury, termin płatności i link PDF do Dostawio.
5. Klient i hurtownia widzą fakturę oraz status realizacji w panelu.

Nie wystawiamy bezpośrednio bazy ERP do internetu. Jeśli system działa lokalnie u klienta, najlepszy wariant to mały konektor HTTPS albo usługa Windows uruchomiona w sieci klienta.

## Systemy priorytetowe w Polsce

1. **BaseLinker / Base**
   - Najszybszy pierwszy pomost, jeżeli hurtownia już używa Base jako centrum zamówień, magazynu i statusów.
   - Dokumentacja: <https://api.baselinker.com/>

2. **InsERT Subiekt GT / Subiekt nexo**
   - Częsty wybór w handlu i magazynie.
   - Zwykle wymaga Sfery GT/nexo albo lokalnego konektora przy instalacji klienta.
   - Dokumentacja startowa Sfery: <https://www.insert.com.pl/dla_uzytkownikow/e-pomoc_techniczna/3330,insert-nexo-%E2%80%93-jak-rozpoczac-prace-ze-sfera.html>

3. **Comarch ERP Optima / Comarch ERP XL**
   - Optima jest popularna w MŚP, XL w większych organizacjach.
   - Najczęściej wymaga partnera wdrożeniowego, modułu integracyjnego albo konektora po stronie klienta.
   - Optima: <https://erp.comarch.com/erp/optima/>
   - ERP XL: <https://erp.comarch.com/erp/erp-xl/>

4. **enova365**
   - Dobry kandydat do integracji API, jeżeli klient ma aktywny moduł i wsparcie partnera.
   - Strona producenta: <https://www.enova.pl/>

5. **Symfonia ERP Handel**
   - Symfonia udostępnia WebAPI dla procesów handlowych i księgowych w zależności od konfiguracji.
   - WebAPI: <https://symfonia.pl/oprogramowanie/web-api>

6. **Wapro MAG / Wapro ERP**
   - Pakiet sprzedażowo-magazynowy, zwykle wymaga API/modułu partnera albo konektora lokalnego.
   - Dokumentacja: <https://wapro.pl/dokumentacja-erp/desktop/docs/intro/>

## Konfiguracja w panelu hurtowni

1. Wejdź do panelu hurtowni na jej subdomenie, np. `https://twoja-hurtownia.dostawio.pl/dashboard`.
2. Otwórz `Integracje`.
3. Wybierz system klienta, np. `BaseLinker / Base`, `Subiekt`, `Comarch Optima`, `Symfonia`.
4. Uzupełnij:
   - adres bazowy ERP/middleware,
   - ID magazynu w ERP,
   - ID cennika w ERP,
   - serię faktur,
   - sposób identyfikacji kontrahenta, np. NIP,
   - sposób identyfikacji towaru, np. SKU,
   - zakres synchronizacji,
   - kontakt techniczny.
5. Zapisz konfigurację.
6. Kliknij `Wygeneruj nowy token`.
7. Skopiuj token i przekaż go integratorowi. Token jest widoczny tylko raz.

## Autoryzacja API

Każde żądanie konektora musi zawierać nagłówek:

```http
Authorization: Bearer <TOKEN_DOSTAWIO>
```

Test połączenia:

```http
GET /api/integrations/v1/health
Authorization: Bearer <TOKEN_DOSTAWIO>
```

Przykładowa odpowiedź:

```json
{
  "success": true,
  "integration": {
    "provider": "baselinker",
    "provider_label": "BaseLinker / Base"
  },
  "endpoints": {
    "orders": "GET /api/integrations/v1/orders",
    "invoice": "POST /api/integrations/v1/orders/{orderId}/invoice",
    "order_status": "POST /api/integrations/v1/orders/{orderId}/status",
    "stock": "POST /api/integrations/v1/products/stock"
  }
}
```

## Pobieranie zamówień

```http
GET /api/integrations/v1/orders?status=new&limit=50
Authorization: Bearer <TOKEN_DOSTAWIO>
```

Parametry:

- `status` - opcjonalnie: `new`, `accepted`, `in_progress`, `ready`, `delivered`, `cancelled`
- `since` - opcjonalnie data ISO, np. `2026-06-08T08:00:00.000Z`
- `limit` - maksymalnie 100

Minimalne mapowanie zamówienia:

- `order_number` -> numer obcy w ERP
- `customers.nip` -> identyfikacja kontrahenta
- `payment_methods.label` -> forma płatności
- `delivery_address` -> adres dostawy
- `order_items.product_sku` -> kod towaru
- `ordered_qty` -> ilość
- `unit_price_net` -> cena netto
- `vat_rate` -> stawka VAT

## Odsyłanie faktury

```http
POST /api/integrations/v1/orders/{orderId}/invoice
Authorization: Bearer <TOKEN_DOSTAWIO>
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

`orderId` może być UUID zamówienia albo numerem zamówienia z Dostawio.

## Aktualizacja statusu zamówienia

```http
POST /api/integrations/v1/orders/{orderId}/status
Authorization: Bearer <TOKEN_DOSTAWIO>
Content-Type: application/json
```

```json
{
  "status": "in_progress",
  "external_order_id": "ZK-98765",
  "external_order_number": "ZK/2026/06/155",
  "external_order_status": "Przyjęte do kompletacji"
}
```

Dostępne statusy Dostawio:

- `new`
- `accepted`
- `in_progress`
- `ready`
- `delivered`
- `cancelled`

## Aktualizacja stanów magazynowych

```http
POST /api/integrations/v1/products/stock
Authorization: Bearer <TOKEN_DOSTAWIO>
Content-Type: application/json
```

```json
{
  "items": [
    {
      "sku": "KAW-001",
      "stock_quantity": 120,
      "stock_status": "available"
    },
    {
      "sku": "NAB-100",
      "stock_quantity": 0,
      "stock_status": "unavailable"
    }
  ]
}
```

Limit jednego żądania: 500 produktów. Aktualizacja działa po `tenant_id` integracji oraz `sku`, więc SKU musi być unikalnym kodem towaru w danej hurtowni.

## Checklista przed produkcją

- Token API wygenerowany w panelu hurtowni.
- Test `GET /api/integrations/v1/health` zwraca `success: true`.
- Ustalono identyfikację kontrahenta: NIP, e-mail, zewnętrzne ID albo mapowanie ręczne.
- Ustalono identyfikację towaru: SKU, EAN, zewnętrzne ID albo mapowanie ręczne.
- Ustalono magazyn ERP i cennik ERP.
- Ustalono, gdzie powstaje faktura: ERP, Base, system księgowy albo middleware.
- Przetestowano jedno zamówienie od złożenia do faktury.
- Przetestowano brakujące SKU i błędny token.

## Bezpieczeństwo

- W bazie zapisujemy tylko hash tokena API.
- Token pokazuje się tylko raz po wygenerowaniu.
- Token można rotować per hurtownia.
- Konektor powinien działać na koncie technicznym z minimalnymi uprawnieniami.
- Lokalne bazy ERP nie powinny być wystawiane publicznie.
- Linki PDF do faktur docelowo najlepiej trzymać w prywatnym storage z podpisanymi linkami czasowymi.
