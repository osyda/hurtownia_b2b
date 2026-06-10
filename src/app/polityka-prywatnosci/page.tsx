import type { Metadata } from 'next'
import { LegalPageShell } from '@/components/legal/legal-page'
import { cookieCategories, legalCompany } from '@/lib/legal'

export const metadata: Metadata = {
  title: 'Polityka prywatności - Dostawio Connect',
  description: 'Polityka prywatności platformy Dostawio Connect, informacje RODO, cookies i zasady przetwarzania danych.',
}

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      eyebrow="Dokument prawny"
      title="Polityka prywatności"
      description="Ten dokument opisuje, jakie dane przetwarzamy w ramach serwisu Dostawio Connect, w jakim celu, przez jaki czas oraz jakie prawa przysługują użytkownikom platformy."
    >
      <h2>1. Administrator danych</h2>
      <p>
        Administratorem danych osobowych przetwarzanych w ramach serwisu {legalCompany.domain} oraz subdomen hurtowni
        działających w modelu Dostawio Connect jest {legalCompany.owner}, {legalCompany.legalForm},
        adres: {legalCompany.address}.
      </p>
      <p>
        Kontakt w sprawach prywatności i ochrony danych: <a href={`mailto:${legalCompany.email}`}>{legalCompany.email}</a>.
      </p>

      <h2>2. Zakres danych</h2>
      <p>W zależności od sposobu korzystania z platformy możemy przetwarzać następujące dane:</p>
      <ul>
        <li>dane kontaktowe osoby zgłaszającej demo: imię i nazwisko, e-mail, telefon, nazwa hurtowni, NIP, treść wiadomości;</li>
        <li>dane kont użytkowników: e-mail, rola w systemie, przypisana hurtownia lub klient B2B;</li>
        <li>dane hurtowni: nazwa, adres, dane kontaktowe, ustawienia sklepu, kategorie, produkty, cenniki, formy płatności i dostawy;</li>
        <li>dane klientów B2B hurtowni: dane firmy, NIP, adresy, osoby kontaktowe, warunki handlowe i historia zamówień;</li>
        <li>dane zamówień: pozycje koszyka, ilości, ceny, statusy, adresy dostawy, forma płatności, uwagi do zamówienia;</li>
        <li>dane techniczne: adres IP, informacje o urządzeniu, przeglądarce, logach bezpieczeństwa i zdarzeniach systemowych.</li>
      </ul>

      <h2>3. Cele i podstawy prawne przetwarzania</h2>
      <table>
        <thead>
          <tr>
            <th>Cel</th>
            <th>Podstawa prawna</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td data-label="Cel">Obsługa zgłoszenia demo, kontakt sprzedażowy i przygotowanie oferty.</td>
            <td data-label="Podstawa prawna">Art. 6 ust. 1 lit. f RODO, czyli prawnie uzasadniony interes administratora.</td>
          </tr>
          <tr>
            <td data-label="Cel">Założenie i prowadzenie konta hurtowni, klienta B2B lub administratora.</td>
            <td data-label="Podstawa prawna">Art. 6 ust. 1 lit. b RODO, czyli wykonanie umowy lub działania przed jej zawarciem.</td>
          </tr>
          <tr>
            <td data-label="Cel">Realizacja zamówień B2B, historia zamówień, obsługa płatności i dostaw.</td>
            <td data-label="Podstawa prawna">Art. 6 ust. 1 lit. b RODO oraz art. 6 ust. 1 lit. c RODO, gdy wynika to z obowiązków prawnych.</td>
          </tr>
          <tr>
            <td data-label="Cel">Bezpieczeństwo, diagnostyka błędów, przeciwdziałanie nadużyciom i utrzymanie infrastruktury.</td>
            <td data-label="Podstawa prawna">Art. 6 ust. 1 lit. f RODO.</td>
          </tr>
          <tr>
            <td data-label="Cel">Opcjonalna analityka lub marketing, jeżeli zostaną wdrożone.</td>
            <td data-label="Podstawa prawna">Art. 6 ust. 1 lit. a RODO, czyli zgoda użytkownika.</td>
          </tr>
        </tbody>
      </table>

      <h2>4. Odbiorcy danych i dostawcy technologiczni</h2>
      <p>
        Dane mogą być powierzane podmiotom wspierającym działanie platformy, takim jak dostawcy hostingu,
        baz danych, poczty transakcyjnej, monitoringu błędów, obsługi domen i narzędzi administracyjnych.
        Aktualnie platforma może korzystać m.in. z infrastruktury Vercel, Supabase oraz Resend.
      </p>
      <p>
        Dane mogą być także udostępniane podmiotom uprawnionym na podstawie przepisów prawa, np. organom publicznym,
        sądom lub organom ścigania, jeżeli taki obowiązek wynika z przepisów.
      </p>

      <h2>5. Okres przechowywania danych</h2>
      <ul>
        <li>dane zgłoszeń demo przechowujemy przez okres potrzebny do obsługi zapytania i dalszego kontaktu handlowego, nie dłużej niż 24 miesiące bez ponownego kontaktu;</li>
        <li>dane kont i zamówień przechowujemy przez okres korzystania z platformy oraz przez okres wymagany przepisami podatkowymi, księgowymi lub dochodzeniem roszczeń;</li>
        <li>dane techniczne i logi bezpieczeństwa przechowujemy przez czas niezbędny do zapewnienia stabilności i bezpieczeństwa systemu;</li>
        <li>dane przetwarzane na podstawie zgody przechowujemy do czasu jej wycofania lub utraty przydatności.</li>
      </ul>

      <h2>6. Prawa użytkownika</h2>
      <p>Osoba, której dane dotyczą, ma prawo do:</p>
      <ul>
        <li>dostępu do swoich danych,</li>
        <li>sprostowania danych,</li>
        <li>usunięcia danych, jeżeli pozwalają na to przepisy,</li>
        <li>ograniczenia przetwarzania,</li>
        <li>przenoszenia danych,</li>
        <li>wniesienia sprzeciwu wobec przetwarzania,</li>
        <li>wycofania zgody w dowolnym momencie, jeżeli przetwarzanie odbywa się na podstawie zgody,</li>
        <li>wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych.</li>
      </ul>
      <p>Wnioski dotyczące danych należy kierować na adres: <a href={`mailto:${legalCompany.email}`}>{legalCompany.email}</a>.</p>

      <h2>7. Transfer danych poza Europejski Obszar Gospodarczy</h2>
      <p>
        Jeżeli dostawcy technologiczni przetwarzają dane poza Europejskim Obszarem Gospodarczym,
        stosujemy mechanizmy wymagane przez RODO, w szczególności standardowe klauzule umowne lub inne
        podstawy prawne dopuszczające taki transfer.
      </p>

      <h2>8. Cookies i podobne technologie</h2>
      <p>
        Platforma korzysta z cookies oraz podobnych technologii, takich jak localStorage, aby zapewnić działanie kont,
        koszyka, bezpieczeństwa i preferencji użytkownika. Opcjonalne narzędzia analityczne lub marketingowe nie powinny
        być uruchamiane bez wcześniejszej zgody użytkownika.
      </p>
      <table>
        <thead>
          <tr>
            <th>Kategoria</th>
            <th>Status</th>
            <th>Cel</th>
            <th>Przykłady</th>
            <th>Okres</th>
          </tr>
        </thead>
        <tbody>
          {cookieCategories.map(category => (
            <tr key={category.name}>
              <td data-label="Kategoria">{category.name}</td>
              <td data-label="Status">{category.status}</td>
              <td data-label="Cel">{category.purpose}</td>
              <td data-label="Przykłady">{category.examples}</td>
              <td data-label="Okres">{category.retention}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>9. Zarządzanie zgodą cookies</h2>
      <p>
        Przy pierwszej wizycie użytkownik widzi baner zgody cookies. Może zaakceptować wszystkie kategorie albo pozostawić
        tylko cookies niezbędne. Decyzja jest zapisywana w przeglądarce. Zmianę zgody można wykonać przez wyczyszczenie
        danych strony w przeglądarce lub przez kontakt z administratorem do czasu dodania panelu zarządzania zgodami.
      </p>

      <h2>10. Zmiany polityki prywatności</h2>
      <p>
        Polityka może być aktualizowana wraz z rozwojem platformy, integracji i zakresu usług. Aktualna wersja dokumentu
        jest dostępna pod adresem <a href={legalCompany.privacyUrl}>{legalCompany.privacyUrl}</a>.
      </p>
    </LegalPageShell>
  )
}
