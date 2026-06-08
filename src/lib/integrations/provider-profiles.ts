export const integrationProviderValues = [
  'generic_rest',
  'baselinker',
  'insert_subiekt',
  'comarch_optima',
  'comarch_xl',
  'enova365',
  'symfonia',
  'wapro',
  'custom',
] as const

export type IntegrationProviderValue = typeof integrationProviderValues[number]

export type IntegrationCapability =
  | 'orders_export'
  | 'invoice_import'
  | 'stock_import'
  | 'price_import'
  | 'product_import'
  | 'status_import'

export const integrationCapabilityLabels: Record<IntegrationCapability, string> = {
  orders_export: 'pobieranie zamówień',
  invoice_import: 'odsyłanie faktur',
  stock_import: 'aktualizacja stanów',
  price_import: 'aktualizacja cen',
  product_import: 'import produktów',
  status_import: 'aktualizacja statusów',
}

export const integrationModeLabels = {
  api_pull: 'ERP pobiera zamówienia z API',
  webhook_push: 'Portal wysyła webhook do ERP',
  middleware: 'Konektor/middleware klienta',
  manual: 'Tryb ręczny / import plików',
} as const

export interface IntegrationProviderProfile {
  value: IntegrationProviderValue
  label: string
  shortLabel: string
  summary: string
  recommendedMode: keyof typeof integrationModeLabels
  difficulty: 'łatwa' | 'średnia' | 'zaawansowana'
  bestFor: string
  docsUrl?: string
  capabilities: IntegrationCapability[]
  requirements: string[]
  implementationNotes: string[]
}

export const integrationProviderProfiles: IntegrationProviderProfile[] = [
  {
    value: 'generic_rest',
    label: 'Uniwersalne REST API',
    shortLabel: 'REST API',
    summary: 'Najbezpieczniejszy start, gdy hurtownia ma własny system lub partnera technicznego.',
    recommendedMode: 'api_pull',
    difficulty: 'średnia',
    bestFor: 'Własne systemy ERP/WMS, dedykowane middleware i integratorzy klienta.',
    capabilities: ['orders_export', 'invoice_import', 'stock_import', 'status_import'],
    requirements: [
      'Osoba techniczna po stronie hurtowni lub dostawcy ERP.',
      'Publiczny adres HTTPS konektora albo usługa uruchomiona po stronie klienta.',
      'Mapowanie SKU, kontrahenta, magazynu i form płatności.',
    ],
    implementationNotes: [
      'Konektor powinien pobierać zamówienia cyklicznie i zapisywać ostatni czas synchronizacji.',
      'Nie wystawiaj bazy ERP do internetu. Wystaw tylko mały konektor HTTPS.',
      'Token Dostawio jest widoczny tylko raz po wygenerowaniu.',
    ],
  },
  {
    value: 'baselinker',
    label: 'BaseLinker / Base',
    shortLabel: 'Base',
    summary: 'Najszybszy pomost, jeżeli hurtownia już używa BaseLinkera/Base jako centrum zamówień i magazynu.',
    recommendedMode: 'middleware',
    difficulty: 'łatwa',
    bestFor: 'Firmy, które mają BaseLinker/Base między ERP, sklepami i magazynami.',
    docsUrl: 'https://api.baselinker.com/',
    capabilities: ['orders_export', 'invoice_import', 'stock_import', 'status_import'],
    requirements: [
      'Token API BaseLinker/Base po stronie klienta.',
      'Ustalone statusy zamówień i magazyn zewnętrzny.',
      'Decyzja, czy faktura powstaje w Base, ERP, czy osobnym systemie księgowym.',
    ],
    implementationNotes: [
      'BaseLinker API obsługuje zamówienia, faktury, statusy oraz aktualizacje stanów magazynowych.',
      'Dla faktur wystawionych w ERP można odsyłać numer i link PDF do Dostawio.',
      'To dobry pierwszy konektor produkcyjny, gdy nie ma jeszcze bezpośredniego dostępu do ERP.',
    ],
  },
  {
    value: 'insert_subiekt',
    label: 'InsERT Subiekt GT / nexo',
    shortLabel: 'Subiekt',
    summary: 'Częsty wybór w handlu i magazynie. Zwykle wymaga Sfery lub lokalnego konektora przy instalacji klienta.',
    recommendedMode: 'middleware',
    difficulty: 'zaawansowana',
    bestFor: 'Hurtownie pracujące lokalnie na Subiekcie GT albo Subiekcie nexo.',
    docsUrl: 'https://www.insert.com.pl/dla_uzytkownikow/e-pomoc_techniczna/3330,insert-nexo-%E2%80%93-jak-rozpoczac-prace-ze-sfera.html',
    capabilities: ['orders_export', 'invoice_import', 'stock_import', 'price_import', 'status_import'],
    requirements: [
      'Licencja i dostęp do Sfery GT/nexo lub partner wdrożeniowy.',
      'Serwis Windows/konektor działający w sieci klienta.',
      'Mapowanie kontrahenta po NIP oraz towaru po SKU/kodzie kreskowym.',
    ],
    implementationNotes: [
      'Najczęściej nie podłączamy się bezpośrednio z chmury do bazy klienta.',
      'Konektor powinien tworzyć ZK/WZ/FV zgodnie z praktyką hurtowni.',
      'Warto wcześniej ustalić serie dokumentów i magazyn domyślny.',
    ],
  },
  {
    value: 'comarch_optima',
    label: 'Comarch ERP Optima',
    shortLabel: 'Optima',
    summary: 'Popularny system MŚP w Polsce. Często potrzebuje warstwy API albo konektora partnera.',
    recommendedMode: 'middleware',
    difficulty: 'zaawansowana',
    bestFor: 'Hurtownie korzystające z Optimy do handlu, magazynu i fakturowania.',
    docsUrl: 'https://erp.comarch.com/erp/optima/',
    capabilities: ['orders_export', 'invoice_import', 'stock_import', 'price_import'],
    requirements: [
      'Dostęp do środowiska Comarch klienta i partnera wdrożeniowego.',
      'Ustalenie, czy integracja idzie przez moduł, WebService/API partnera czy pliki pośrednie.',
      'Mapowanie magazynów, kontrahentów, towarów i serii faktur.',
    ],
    implementationNotes: [
      'Dla Optimy często najbezpieczniejszy jest konektor uruchomiony po stronie klienta.',
      'Pierwszy etap może obsłużyć zamówienia i faktury, a stany/ceny dopiąć po mapowaniu SKU.',
      'Przed wdrożeniem trzeba potwierdzić wersję Optimy i dostępny moduł integracyjny.',
    ],
  },
  {
    value: 'comarch_xl',
    label: 'Comarch ERP XL',
    shortLabel: 'Comarch XL',
    summary: 'Wariant dla większych organizacji, zwykle z indywidualnym wdrożeniem integracyjnym.',
    recommendedMode: 'middleware',
    difficulty: 'zaawansowana',
    bestFor: 'Większe hurtownie z rozbudowanymi procesami sprzedaży i magazynu.',
    docsUrl: 'https://erp.comarch.com/erp/erp-xl/',
    capabilities: ['orders_export', 'invoice_import', 'stock_import', 'price_import', 'product_import', 'status_import'],
    requirements: [
      'Partner Comarch lub administrator ERP XL po stronie klienta.',
      'Uzgodnione typy dokumentów, magazyny, rezerwacje i statusy.',
      'Środowisko testowe albo kopia procesu bez wpływu na produkcję.',
    ],
    implementationNotes: [
      'XL wymaga zwykle projektu integracyjnego, nie tylko wklejenia tokena.',
      'Najpierw wdrażamy eksport zamówień i import faktur, potem pełną synchronizację katalogu.',
      'Trzeba uważać na reguły cenowe i uprawnienia operatorów ERP.',
    ],
  },
  {
    value: 'enova365',
    label: 'enova365',
    shortLabel: 'enova365',
    summary: 'Dobry kandydat do integracji, jeżeli klient ma aktywny moduł API i wsparcie partnera.',
    recommendedMode: 'api_pull',
    difficulty: 'średnia',
    bestFor: 'Firmy pracujące w enova365 z otwartym dostępem API.',
    docsUrl: 'https://www.enova.pl/',
    capabilities: ['orders_export', 'invoice_import', 'stock_import', 'price_import'],
    requirements: [
      'Informacja, czy klient ma dostęp API i jakie są adresy środowisk.',
      'Użytkownik integracyjny z ograniczonymi uprawnieniami.',
      'Mapowanie magazynu, towarów, cenników i kontrahentów.',
    ],
    implementationNotes: [
      'Jeżeli API jest dostępne, integracja może być czystsza niż lokalny konektor.',
      'Przed wdrożeniem trzeba potwierdzić endpointy i model autoryzacji dla konkretnej instalacji.',
      'Warto zacząć od zamówień i faktur, a ceny/stany uruchomić po testach mapowania.',
    ],
  },
  {
    value: 'symfonia',
    label: 'Symfonia ERP Handel',
    shortLabel: 'Symfonia',
    summary: 'Symfonia udostępnia WebAPI dla modułów handlowych i finansowo-księgowych w zależności od konfiguracji.',
    recommendedMode: 'api_pull',
    difficulty: 'średnia',
    bestFor: 'Hurtownie z Symfonia Handel i dostępem do WebAPI.',
    docsUrl: 'https://symfonia.pl/oprogramowanie/web-api',
    capabilities: ['orders_export', 'invoice_import', 'stock_import', 'price_import'],
    requirements: [
      'Włączone WebAPI Symfonii i dane środowiska.',
      'Użytkownik API oraz zakres uprawnień.',
      'Mapowanie towarów, kontrahentów i dokumentów handlowych.',
    ],
    implementationNotes: [
      'Symfonia WebAPI korzysta z JSON i REST/WebServices zależnie od konfiguracji.',
      'Trzeba potwierdzić wersję programu oraz moduły, które klient ma aktywne.',
      'Wdrożenie powinno mieć oddzielny użytkownik techniczny.',
    ],
  },
  {
    value: 'wapro',
    label: 'Wapro MAG / Wapro ERP',
    shortLabel: 'Wapro',
    summary: 'Pakiet Wapro wspiera sprzedaż i magazyn. Integracja zwykle wymaga API/modułu partnera lub konektora.',
    recommendedMode: 'middleware',
    difficulty: 'zaawansowana',
    bestFor: 'Hurtownie korzystające z Wapro MAG i procesów magazynowo-sprzedażowych.',
    docsUrl: 'https://wapro.pl/dokumentacja-erp/desktop/docs/intro/',
    capabilities: ['orders_export', 'invoice_import', 'stock_import', 'price_import'],
    requirements: [
      'Potwierdzenie dostępnego modułu API albo partnera integracyjnego.',
      'Lokalny konektor przy środowisku klienta, jeśli nie ma publicznego API.',
      'Mapowanie magazynów, towarów i kontrahentów.',
    ],
    implementationNotes: [
      'Na start najrozsądniej przygotować konektor klienta pobierający zamówienia z Dostawio.',
      'Stany magazynowe można synchronizować po SKU do endpointu stock.',
      'Przed produkcją trzeba przejść test na kilku realnych dokumentach.',
    ],
  },
  {
    value: 'custom',
    label: 'Inny system klienta',
    shortLabel: 'Custom',
    summary: 'Profil dla autorskich systemów hurtowni albo niszowych ERP/WMS.',
    recommendedMode: 'api_pull',
    difficulty: 'średnia',
    bestFor: 'Systemy własne, dedykowane lub branżowe.',
    capabilities: ['orders_export', 'invoice_import', 'stock_import', 'status_import'],
    requirements: [
      'Dokumentacja API albo osoba techniczna klienta.',
      'Ustalone mapowanie danych i odpowiedzialność za konektor.',
      'Możliwość testu na kopii danych albo sandboxie.',
    ],
    implementationNotes: [
      'Własny system powinien traktować Dostawio jako neutralną warstwę zamówień.',
      'Najpierw uruchamiamy minimalny przepływ: zamówienie -> dokument ERP -> faktura w panelu.',
      'Dopiero potem dokładamy automatyczne ceny, produkty i magazyny.',
    ],
  },
]

export function getIntegrationProviderProfile(provider: string | null | undefined) {
  return integrationProviderProfiles.find(profile => profile.value === provider) ?? integrationProviderProfiles[0]
}
