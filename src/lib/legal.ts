export const legalCompany = {
  serviceName: 'Dostawio Connect',
  domain: 'dostawio.pl',
  owner: 'Kuba Osyda',
  legalForm: 'niezaewidencjonowana działalność gospodarcza',
  address: 'ul. Rynek 13/1, 83-400 Kościerzyna, Polska',
  email: 'kontakt@dostawio.pl',
  privacyUrl: 'https://dostawio.pl/polityka-prywatnosci',
  termsUrl: 'https://dostawio.pl/regulamin',
  effectiveDate: '10 czerwca 2026 r.',
}

export const cookieCategories = [
  {
    name: 'Niezbędne',
    status: 'zawsze aktywne',
    purpose: 'Logowanie, bezpieczeństwo sesji, koszyk B2B, zapamiętanie decyzji cookies i prawidłowe działanie platformy.',
    examples: 'cookies Supabase Auth, dostawio_cookie_consent, b2b-cart w localStorage',
    retention: 'czas sesji lub do 12 miesięcy',
  },
  {
    name: 'Preferencyjne',
    status: 'opcjonalne',
    purpose: 'Zapamiętanie wygody pracy użytkownika, np. ostatniego widoku katalogu.',
    examples: 'dostawio-catalog-view w localStorage',
    retention: 'do 12 miesięcy',
  },
  {
    name: 'Analityczne',
    status: 'opcjonalne',
    purpose: 'Pomiar odwiedzin, stabilności strony i skuteczności formularzy, wyłącznie po zgodzie użytkownika.',
    examples: 'obecnie niewdrożone; gotowe pod przyszłe narzędzia analityczne',
    retention: 'zgodnie z konfiguracją narzędzia po wdrożeniu',
  },
  {
    name: 'Marketingowe',
    status: 'opcjonalne',
    purpose: 'Pomiar kampanii i remarketing, wyłącznie po odrębnej zgodzie użytkownika.',
    examples: 'obecnie niewdrożone; np. piksele reklamowe po przyszłej integracji',
    retention: 'zgodnie z konfiguracją narzędzia po wdrożeniu',
  },
]

