import type { Metadata } from 'next'
import { LegalPageShell } from '@/components/legal/legal-page'
import { legalCompany } from '@/lib/legal'

export const metadata: Metadata = {
  title: 'Regulamin - Dostawio Connect',
  description: 'Regulamin korzystania z platformy Dostawio Connect dla hurtowni i klientów B2B.',
}

export default function TermsPage() {
  return (
    <LegalPageShell
      eyebrow="Dokument prawny"
      title="Regulamin"
      description="Regulamin określa podstawowe zasady korzystania z serwisu Dostawio Connect, zgłoszeń demo, kont hurtowni, kont klientów B2B oraz usług wdrożeniowych i integracyjnych."
    >
      <h2>§ 1. Postanowienia ogólne</h2>
      <ol>
        <li>Regulamin określa zasady korzystania z serwisu internetowego Dostawio Connect dostępnego pod adresem {legalCompany.domain} oraz w subdomenach hurtowni.</li>
        <li>Usługodawcą jest {legalCompany.owner}, {legalCompany.legalForm}, adres: {legalCompany.address}.</li>
        <li>Kontakt z Usługodawcą odbywa się pod adresem e-mail: <a href={`mailto:${legalCompany.email}`}>{legalCompany.email}</a>.</li>
        <li>Dostawio Connect jest platformą B2B przeznaczoną do obsługi zamówień pomiędzy hurtownią a jej klientami biznesowymi.</li>
        <li>Informacje na stronie mają charakter informacyjny i nie stanowią oferty w rozumieniu Kodeksu cywilnego, chyba że strony wyraźnie ustalą inaczej.</li>
      </ol>

      <h2>§ 2. Definicje</h2>
      <ol>
        <li><strong>Platforma</strong> — system Dostawio Connect umożliwiający prowadzenie katalogu B2B, obsługę klientów, cenników, koszyka i zamówień.</li>
        <li><strong>Hurtownia</strong> — podmiot gospodarczy korzystający z platformy w celu przyjmowania zamówień od swoich klientów B2B.</li>
        <li><strong>Klient B2B</strong> — klient hurtowni, który otrzymał dostęp do sklepu lub panelu zamówień prowadzonego w ramach platformy.</li>
        <li><strong>Konto</strong> — indywidualny dostęp do platformy przypisany do użytkownika, roli i uprawnień.</li>
        <li><strong>Subdomena hurtowni</strong> — adres w domenie Dostawio, np. nazwahurtowni.dostawio.pl, pod którym działa sklep lub panel klienta B2B.</li>
        <li><strong>Integracja</strong> — połączenie platformy z systemem zewnętrznym, np. ERP, systemem magazynowym, fakturowym lub sprzedażowym.</li>
      </ol>

      <h2>§ 3. Zakres usług</h2>
      <p>Platforma może obejmować w szczególności:</p>
      <ul>
        <li>utworzenie panelu hurtowni i sklepu B2B w subdomenie,</li>
        <li>zarządzanie produktami, kategoriami, cennikami, klientami i formami płatności,</li>
        <li>składanie zamówień przez klientów B2B,</li>
        <li>historię i statusy zamówień,</li>
        <li>powiadomienia e-mail,</li>
        <li>API i przygotowanie pod integracje z systemami zewnętrznymi,</li>
        <li>usługi wdrożeniowe, konfiguracyjne i doradcze.</li>
      </ul>

      <h2>§ 4. Dostęp demo</h2>
      <ol>
        <li>Dostęp demo nie jest publiczny i może być przyznany po wypełnieniu formularza kontaktowego oraz podstawowej weryfikacji hurtowni.</li>
        <li>Wysłanie formularza demo nie oznacza zawarcia umowy ani gwarancji przyznania dostępu.</li>
        <li>Usługodawca może odmówić udostępnienia demo, jeżeli zgłoszenie jest niepełne, budzi wątpliwości albo nie dotyczy realnego zastosowania B2B.</li>
      </ol>

      <h2>§ 5. Konto i bezpieczeństwo</h2>
      <ol>
        <li>Użytkownik zobowiązuje się podawać prawdziwe dane oraz chronić dane logowania przed dostępem osób nieuprawnionych.</li>
        <li>Hurtownia odpowiada za nadawanie dostępu swoim pracownikom i klientom B2B oraz za poprawność danych wprowadzonych do panelu.</li>
        <li>W przypadku podejrzenia naruszenia bezpieczeństwa należy niezwłocznie skontaktować się z Usługodawcą.</li>
        <li>Usługodawca może czasowo ograniczyć dostęp do konta, jeżeli jest to uzasadnione bezpieczeństwem platformy lub ochroną danych.</li>
      </ol>

      <h2>§ 6. Zamówienia B2B</h2>
      <ol>
        <li>Platforma służy do technicznej obsługi zamówień pomiędzy hurtownią a jej klientami B2B.</li>
        <li>Warunki handlowe, ceny, dostępność produktów, formy płatności, terminy dostaw i reklamacje dotyczące towaru ustala hurtownia ze swoim klientem B2B.</li>
        <li>Dostawio nie jest stroną sprzedaży towarów pomiędzy hurtownią a klientem B2B, chyba że strony wyraźnie ustalą inaczej w odrębnej umowie.</li>
        <li>Hurtownia odpowiada za poprawność katalogu, cen, stanów, danych podatkowych i informacji o produktach.</li>
      </ol>

      <h2>§ 7. Wdrożenie, abonament i integracje</h2>
      <ol>
        <li>Szczegółowy zakres wdrożenia, abonamentu, limitów i integracji jest ustalany indywidualnie lub zgodnie z aktualnym cennikiem dostępnym na stronie.</li>
        <li>Integracje z systemami zewnętrznymi mogą wymagać dostępu do dokumentacji API, środowiska testowego, danych testowych lub wsparcia dostawcy systemu hurtowni.</li>
        <li>Termin realizacji integracji zależy od kompletności informacji, dostępności API systemu zewnętrznego oraz współpracy po stronie hurtowni.</li>
        <li>Usługodawca nie odpowiada za ograniczenia, awarie ani zmiany działania systemów zewnętrznych, które nie są pod jego kontrolą.</li>
      </ol>

      <h2>§ 8. Płatności</h2>
      <ol>
        <li>Opłaty za korzystanie z platformy mogą obejmować opłatę wdrożeniową, abonament miesięczny, abonament okresowy, opłaty za integracje lub indywidualne prace konfiguracyjne.</li>
        <li>Ceny prezentowane na stronie mogą być cenami netto i są kierowane do podmiotów prowadzących działalność gospodarczą.</li>
        <li>Brak terminowej płatności może skutkować ograniczeniem dostępu do funkcji platformy po wcześniejszym kontakcie z hurtownią.</li>
      </ol>

      <h2>§ 9. Odpowiedzialność</h2>
      <ol>
        <li>Usługodawca dokłada należytej staranności, aby platforma działała stabilnie i bezpiecznie.</li>
        <li>Platforma może być czasowo niedostępna z powodu prac technicznych, aktualizacji, awarii infrastruktury lub zdarzeń niezależnych od Usługodawcy.</li>
        <li>Usługodawca nie odpowiada za treści, dane, ceny, produkty i informacje wprowadzone przez hurtownię.</li>
        <li>Usługodawca nie ponosi odpowiedzialności za utracone korzyści, przerwy w działaniu systemów zewnętrznych ani decyzje biznesowe podjęte na podstawie danych wprowadzonych przez użytkowników, w zakresie dopuszczalnym przez prawo.</li>
      </ol>

      <h2>§ 10. Dane osobowe i cookies</h2>
      <p>
        Zasady przetwarzania danych osobowych, cookies i podobnych technologii opisuje
        <a href="/polityka-prywatnosci"> Polityka prywatności</a>.
      </p>

      <h2>§ 11. Reklamacje i kontakt</h2>
      <ol>
        <li>Reklamacje dotyczące działania platformy można zgłaszać na adres: <a href={`mailto:${legalCompany.email}`}>{legalCompany.email}</a>.</li>
        <li>Zgłoszenie powinno zawierać opis problemu, adres subdomeny hurtowni, dane kontaktowe oraz informacje umożliwiające analizę sprawy.</li>
        <li>Usługodawca odpowie na reklamację w rozsądnym terminie, zwykle do 14 dni roboczych.</li>
      </ol>

      <h2>§ 12. Zmiany regulaminu</h2>
      <ol>
        <li>Regulamin może być aktualizowany w związku z rozwojem platformy, zmianami prawa, zmianami technologicznymi lub zmianą zakresu usług.</li>
        <li>Aktualna wersja regulaminu jest dostępna pod adresem <a href={legalCompany.termsUrl}>{legalCompany.termsUrl}</a>.</li>
        <li>W sprawach nieuregulowanych regulaminem zastosowanie mają przepisy prawa polskiego.</li>
      </ol>
    </LegalPageShell>
  )
}

