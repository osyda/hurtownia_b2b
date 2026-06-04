# hurtownia_b2b
PLAN ZAŁOŻEŃ PROJEKTU — PROFESJONALNA PLATFORMA B2B DLA HURTOWNI REGIONALNYCH

Nazwa robocza projektu:
B2B CONNECT

Cel dokumentu:
Ten dokument opisuje założenia biznesowe, funkcjonalne i jakościowe dla stworzenia profesjonalnej platformy B2B dla hurtowni regionalnych. Dokument nie narzuca konkretnych technologii ani sposobu implementacji. Decyzje techniczne powinny zostać dobrane przez wykonawcę na podstawie najlepszych praktyk, bezpieczeństwa, skalowalności, kosztów utrzymania i możliwości dalszego rozwoju systemu.

Projekt nie ma być prototypem ani prostą stroną internetową. Celem jest stworzenie profesjonalnego, nowoczesnego, skalowalnego systemu B2B, który może być rozwijany komercyjnie i wdrażany dla kolejnych hurtowni.

============================================================
1. OGÓLNA IDEA PROJEKTU
============================================================

Celem jest stworzenie platformy zamówień B2B dla hurtowni regionalnych, np.:

- hurtowni mięsa,
- hurtowni warzyw i owoców,
- hurtowni nabiału,
- hurtowni mrożonek,
- hurtowni napojów,
- hurtowni produktów dla branży HoReCa.

System ma działać w modelu podobnym do platform typu Makro / cash & carry / hurtowy panel zamówień online.

Główna idea:
kontrahenci hurtowni, np. restauracje, hotele, bary, kawiarnie, sklepy i punkty gastronomiczne, powinni mieć możliwość składania zamówień online w uporządkowanym, nowoczesnym i wygodnym panelu.

Platforma ma ułatwiać hurtowniom przyjmowanie zamówień od stałych klientów, ograniczać liczbę telefonów, wiadomości SMS, e-maili i zamówień składanych chaotycznie przez komunikatory.

System nie powinien być traktowany jako zwykły sklep internetowy B2C. To ma być profesjonalna platforma B2B, gdzie kluczowe są:

- konta firmowe,
- indywidualne ceny,
- różne warunki handlowe,
- szybkie ponawianie zamówień,
- historia zamówień,
- obsługa wielu hurtowni,
- możliwość dalszych integracji,
- profesjonalny panel administracyjny.

============================================================
2. CHARAKTER SYSTEMU
============================================================

System powinien być zaprojektowany jako jeden profesjonalny silnik, który może obsługiwać wiele hurtowni.

Nie chodzi o tworzenie osobnej strony od zera dla każdej hurtowni.

Oczekiwany model:
jedna platforma, wiele hurtowni, każda hurtownia ma swoje osobne środowisko, dane, klientów, produkty, ceny, zamówienia i ustawienia.

Każda hurtownia powinna działać niezależnie od pozostałych.

Przykład:
- Hurtownia A ma swoje produkty, klientów i ceny.
- Hurtownia B ma swoje produkty, klientów i ceny.
- Hurtownia C ma swoje produkty, klientów i ceny.

Hurtownie nie powinny widzieć danych innych hurtowni.
Klienci jednej hurtowni nie mogą widzieć produktów, cen ani zamówień innej hurtowni.

System powinien być przygotowany na model multi-tenant, czyli wiele osobnych organizacji w ramach jednej platformy.

============================================================
3. DOŚWIADCZENIE UŻYTKOWNIKA I WYGLĄD
============================================================

System ma być wizualnie nowoczesny, przejrzysty i profesjonalny.

Nie chodzi o techniczne MVP wyglądające jak surowy panel administracyjny.
Platforma powinna wyglądać jak dopracowany produkt SaaS/B2B.

Oczekiwania wizualne:

- nowoczesny dashboard,
- przejrzyste karty produktów,
- czytelny koszyk,
- szybki proces składania zamówienia,
- responsywność na komputerze, tablecie i telefonie,
- prosty i czytelny panel hurtowni,
- intuicyjna obsługa dla osób nietechnicznych,
- estetyka porównywalna z nowoczesnymi aplikacjami biznesowymi.

Panel klienta hurtowni powinien być możliwie prosty, ponieważ korzystać z niego mogą restauratorzy, managerowie, pracownicy biura albo osoby zamawiające towar w pośpiechu.

Najważniejsze są:
- szybkość,
- czytelność,
- mała liczba kliknięć,
- łatwe wyszukiwanie produktów,
- łatwe ponawianie poprzednich zamówień.

============================================================
4. GŁÓWNE GRUPY UŻYTKOWNIKÓW
============================================================

System powinien obsługiwać kilka poziomów użytkowników.

1. Właściciel platformy / Super Admin

To właściciel całego systemu.

Powinien mieć dostęp do:
- listy wszystkich hurtowni,
- konfiguracji hurtowni,
- użytkowników,
- zamówień globalnych,
- ustawień systemowych,
- statusów działania,
- błędów,
- przyszłych integracji,
- danych potrzebnych do obsługi klientów platformy.

2. Hurtownia / Administrator hurtowni

To właściciel, manager lub osoba zarządzająca daną hurtownią.

Powinien mieć dostęp wyłącznie do swojej hurtowni.

Powinien móc:
- zarządzać produktami,
- zarządzać kategoriami,
- zarządzać klientami,
- zarządzać cennikami,
- sprawdzać zamówienia,
- zmieniać statusy zamówień,
- zapraszać klientów do panelu,
- ustawiać zasady dostaw,
- ustawiać branding hurtowni,
- eksportować dane,
- w przyszłości korzystać z integracji z obecnym systemem hurtowni.

3. Pracownik hurtowni

To osoba, która obsługuje zamówienia lub klientów.

Może mieć ograniczone uprawnienia, np.:
- podgląd zamówień,
- zmiana statusów,
- kontakt z klientem,
- obsługa produktów,
- obsługa zamówień.

4. Klient hurtowni

To kontrahent hurtowni, np.:
- restauracja,
- hotel,
- bar,
- kawiarnia,
- sklep,
- firma cateringowa.

Powinien móc:
- zalogować się do panelu,
- przeglądać produkty swojej hurtowni,
- widzieć swoje indywidualne ceny,
- dodać produkty do koszyka,
- złożyć zamówienie,
- wybrać adres i termin dostawy,
- dodać uwagi,
- zobaczyć historię zamówień,
- ponowić wcześniejsze zamówienie.

============================================================
5. PANEL SUPER ADMINA
============================================================

Panel Super Admina powinien służyć do zarządzania całą platformą.

Oczekiwane sekcje:

1. Dashboard główny

Powinien pokazywać:
- liczbę aktywnych hurtowni,
- liczbę klientów,
- liczbę zamówień,
- ostatnie aktywności,
- ewentualne błędy,
- status systemu.

2. Hurtownie

Lista wszystkich hurtowni.

Dane hurtowni:
- nazwa,
- status,
- subdomena lub identyfikator,
- logo,
- kolor przewodni,
- dane kontaktowe,
- liczba klientów,
- liczba produktów,
- liczba zamówień,
- data utworzenia.

3. Użytkownicy

Możliwość zarządzania użytkownikami systemu:
- super adminami,
- administratorami hurtowni,
- pracownikami hurtowni,
- klientami hurtowni.

4. Zamówienia globalne

Podgląd wszystkich zamówień w systemie do celów administracyjnych i supportowych.

5. Ustawienia systemu

Miejsce na:
- dane platformy,
- ustawienia maili,
- ustawienia domen,
- regulaminy,
- politykę prywatności,
- ustawienia przyszłych modułów.

============================================================
6. PANEL HURTOWNI
============================================================

Panel hurtowni powinien być centrum pracy dla konkretnej hurtowni.

Oczekiwane sekcje:

1. Dashboard hurtowni

Powinien pokazywać:
- dzisiejsze zamówienia,
- wartość zamówień,
- nowe zamówienia,
- zamówienia w realizacji,
- liczbę aktywnych klientów,
- liczbę produktów,
- ostatnie aktywności.

2. Produkty

Hurtownia powinna móc zarządzać produktami.

Dane produktu:
- nazwa,
- SKU / kod produktu,
- kategoria,
- jednostka, np. kg, szt., opakowanie, karton,
- opis,
- zdjęcie,
- cena bazowa,
- VAT,
- minimalna ilość zamówienia,
- wielokrotność zamówienia,
- status aktywny / nieaktywny.

3. Kategorie

Kategorie produktów powinny być edytowalne.

Przykłady:
- mięso,
- drób,
- wołowina,
- wieprzowina,
- warzywa,
- owoce,
- nabiał,
- mrożonki,
- napoje.

4. Klienci

Hurtownia powinna móc zarządzać swoimi klientami.

Dane klienta:
- nazwa firmy,
- NIP,
- e-mail,
- telefon,
- adres faktury,
- adresy dostaw,
- status,
- grupa cenowa,
- formy płatności (przypisane przez hurtownię, np. gotówka, przelew 7 dni, przelew 14 dni, karta/BLIK),
- minimalna wartość zamówienia.

5. Cenniki

System musi obsługiwać indywidualne ceny B2B.

Ten sam produkt może mieć różne ceny dla różnych klientów.

Przykład:
- klient A widzi cenę 22 zł/kg,
- klient B widzi cenę 24 zł/kg,
- klient C widzi cenę 20 zł/kg.

System powinien umożliwiać:
- ceny bazowe,
- ceny indywidualne,
- grupy cenowe,
- rabaty,
- ukrywanie produktów dla wybranych klientów,
- pokazywanie produktów tylko wybranym klientom.

6. Zamówienia

Hurtownia powinna widzieć wszystkie swoje zamówienia.

Dane zamówienia:
- numer zamówienia,
- klient,
- data złożenia,
- planowana data dostawy,
- produkty,
- ilości,
- ceny,
- suma netto,
- VAT,
- suma brutto,
- uwagi klienta,
- status.

Przykładowe statusy:
- nowe,
- przyjęte,
- w realizacji,
- gotowe do dostawy,
- zrealizowane,
- anulowane.

Funkcje:
- podgląd zamówienia,
- zmiana statusu,
- notatka wewnętrzna,
- eksport,
- druk / PDF,
- powiadomienia e-mail.

7. Dostawy

System powinien umożliwiać ustawienia dostaw.

Przykładowe ustawienia:
- dni dostaw,
- godziny przyjmowania zamówień,
- minimalna wartość zamówienia,
- komunikat dla klienta,
- obszary dostaw,
- informacja typu: zamówienia do 20:00 są realizowane następnego dnia.

8. Ustawienia hurtowni

Hurtownia powinna móc ustawić:
- nazwę,
- logo,
- kolor przewodni,
- dane kontaktowe,
- e-mail do powiadomień,
- telefon,
- komunikat widoczny dla klientów,
- regulamin / informacje handlowe.

============================================================
7. PANEL KLIENTA HURTOWNI
============================================================

Panel klienta powinien być najprostszy i najbardziej dopracowany wizualnie.

To najważniejszy panel użytkowy.

Oczekiwane sekcje:

1. Logowanie

Klient loguje się do konkretnej hurtowni.

Po wejściu na adres hurtowni powinien widzieć branding tej hurtowni.

2. Dashboard klienta

Po zalogowaniu klient powinien widzieć:
- przycisk „Złóż zamówienie”,
- ostatnie zamówienia,
- najczęściej zamawiane produkty,
- komunikat hurtowni,
- najbliższy możliwy termin dostawy.

3. Katalog produktów

Klient powinien widzieć:
- kategorie,
- produkty,
- zdjęcia,
- jednostki,
- swoje ceny,
- wyszukiwarkę,
- filtr kategorii,
- dostępność, jeżeli będzie obsługiwana.

Przy produkcie:
- nazwa,
- cena,
- jednostka,
- pole ilości,
- przycisk dodania do koszyka.

4. Koszyk

Koszyk powinien pokazywać:
- produkty,
- ilości,
- ceny,
- sumy,
- możliwość zmiany ilości,
- możliwość usunięcia pozycji,
- uwagi do produktu,
- uwagi do całego zamówienia.

5. Finalizacja zamówienia

Klient powinien wybrać:
- adres dostawy,
- datę dostawy,
- formę płatności (jeśli hurtownia przypisała mu więcej niż jedną),
- ewentualne uwagi.

Po potwierdzeniu zamówienia:
- zamówienie zapisuje się w systemie,
- klient otrzymuje potwierdzenie,
- hurtownia otrzymuje informację o nowym zamówieniu,
- zamówienie pojawia się w panelu hurtowni.

6. Historia zamówień

Klient powinien widzieć:
- poprzednie zamówienia,
- statusy,
- daty,
- kwoty,
- szczegóły.

Ważna funkcja:
- „zamów ponownie”.

============================================================
8. SUBDOMENY I BRANDING HURTOWNI
============================================================

Każda hurtownia powinna mieć swoje osobne wejście do systemu.

Przykład:
- mieso.nazwaplatformy.pl
- warzywa.nazwaplatformy.pl
- nabial.nazwaplatformy.pl

Po wejściu na adres konkretnej hurtowni system powinien pokazać:
- nazwę tej hurtowni,
- logo tej hurtowni,
- kolor przewodni tej hurtowni,
- komunikat tej hurtowni,
- panel logowania dla klientów tej hurtowni.

Dopuszczalne jest również wsparcie własnych domen klientów w przyszłości, np.:
- zamowienia.hurtowniax.pl

============================================================
9. DANE I BEZPIECZEŃSTWO
============================================================

Bezpieczeństwo jest kluczowe.

System musi zapewniać izolację danych pomiędzy hurtowniami.

Podstawowa zasada:
użytkownik hurtowni A nie może zobaczyć danych hurtowni B.

Klient hurtowni A nie może zobaczyć:
- produktów hurtowni B,
- cen hurtowni B,
- klientów hurtowni B,
- zamówień hurtowni B.

System powinien mieć:
- role użytkowników,
- uprawnienia,
- zabezpieczenie danych,
- logi istotnych operacji,
- bezpieczne logowanie,
- możliwość rozwoju pod audyt i profesjonalne wdrożenia.

============================================================
10. STANY MAGAZYNOWE
============================================================

Hurtownie korzystają z różnych systemów i różne mają możliwości techniczne.
System musi być elastyczny jeśli chodzi o aktualizację stanów magazynowych.

Model dostępności produktu:
każdy produkt posiada flagę dostępności (dostępny / niedostępny) oraz opcjonalnie
informację o stanie magazynowym. Brak stanu nie blokuje zamawiania — hurtownia
decyduje, co pokazuje klientom.

Obsługiwane sposoby aktualizacji stanów:

1. Ręczny import pliku (Excel / CSV)
   - hurtownia wgrywa plik codziennie lub kiedy chce,
   - system nadpisuje stany na podstawie SKU / kodu produktu,
   - format pliku powinien być opisany i dostępny jako szablon do pobrania.

2. API (dla hurtowni z zaawansowanymi systemami)
   - platforma udostępnia endpoint do aktualizacji stanów,
   - hurtownia integruje swój system (np. Subiekt, WF-Mag, Comarch itp.) z API platformy,
   - aktualizacja może być automatyczna, np. co noc lub po każdej zmianie.

3. Ręczna edycja w panelu
   - hurtownia edytuje stany bezpośrednio w panelu administracyjnym,
   - rozwiązanie dla małych hurtowni bez żadnego systemu zewnętrznego.

Ważne:
- system nie może wymuszać jednego sposobu — każda hurtownia wybiera metodę odpowiednią dla siebie,
- architektura powinna zakładać, że importy będą się powtarzać regularnie,
- w pierwszej wersji wystarczy ręczny import pliku + ręczna edycja,
- API do stanów magazynowych może być kolejnym etapem.

============================================================
10A. IMPORT, EKSPORT I PRZYSZŁE INTEGRACJE
============================================================

System powinien być przygotowany do integracji z obecnym oprogramowaniem hurtowni.

Wiele hurtowni ma już własne systemy, więc platforma nie powinna wymuszać całkowitego przejścia na nowe oprogramowanie.

Docelowy model:
platforma ma działać jako dodatkowy kanał zamówień B2B i może być zintegrowana z obecnym systemem hurtowni.

Na początku wystarczające mogą być:
- import produktów,
- import klientów,
- import cenników,
- import stanów magazynowych,
- eksport zamówień.

Obsługiwane kierunki rozwoju:
- CSV,
- Excel,
- XML,
- API,
- integracje indywidualne,
- integracje z systemami magazynowo-handlowymi (Subiekt, WF-Mag, Comarch itp.).

Ważne:
system powinien mieć strukturę gotową pod przyszłe integracje, ale nie powinien być od początku przeciążony zbędnymi modułami ERP.

============================================================
11. FORMY PŁATNOŚCI
============================================================

Hurtownia ustala każdemu klientowi dostępne formy płatności.
Nie ma jednej globalnej formy — to jest ustawienie per klient.

Przykładowe formy płatności:
- gotówka przy dostawie,
- przelew 7 dni,
- przelew 14 dni,
- przelew 30 dni,
- karta / BLIK przy dostawie.

Zasady działania:
- hurtownia przypisuje klientowi jedną lub więcej form płatności,
- jeśli klient ma więcej niż jedną formę, wybiera ją przy składaniu zamówienia,
- jeśli klient ma tylko jedną formę, jest ona ustawiana automatycznie bez wyboru,
- wybrana forma płatności jest widoczna w szczegółach zamówienia po obu stronach,
- forma płatności trafia do maila z potwierdzeniem zamówienia.

Forma płatności jest częścią profilu klienta hurtowni i może być zmieniana przez hurtownię w dowolnym momencie.

============================================================
12. POWIADOMIENIA E-MAIL I PRZEPŁYW ZAMÓWIENIA
============================================================

System powinien obsługiwać automatyczne wiadomości e-mail.

Przepływ po złożeniu zamówienia przez klienta:

1. Do hurtowni — mail o nowym zamówieniu
   - temat: nowe zamówienie od [nazwa klienta],
   - treść: pełne szczegóły zamówienia (produkty, ilości, ceny, suma, adres, termin dostawy, uwagi, forma płatności),
   - bezpośredni link do zamówienia w panelu hurtowni,
   - hurtownia może kliknąć link i od razu zarządzać zamówieniem.

2. Do klienta — potwierdzenie złożenia zamówienia
   - temat: potwierdzenie zamówienia nr [numer],
   - treść: podsumowanie złożonego zamówienia (produkty, ilości, ceny, suma, adres, termin dostawy),
   - adnotacja: "Zamówione ilości mogą zostać skorygowane przez hurtownię na etapie kompletowania zamówienia. O ostatecznych ilościach zostaniesz poinformowany.",
   - forma płatności.

Korekta ilości przez hurtownię:

Hurtownia ma możliwość edycji ilości w zamówieniu po jego przyjęciu.
Przykład: klient zamówił 10 kg schabu, hurtownia skompletowała 10,4 kg.

Zasady:
- hurtownia wpisuje rzeczywistą ilość przy każdej pozycji,
- system automatycznie przelicza wartość pozycji i całe zamówienie,
- zmiana ilości przez hurtownię jest rejestrowana w historii zamówienia (kto zmienił, kiedy, z jakiej ilości na jaką),
- po skorygowaniu ilości klient powinien otrzymać powiadomienie e-mail z zaktualizowanym zamówieniem,
- jeśli hurtownia pominie produkt (ilość 0), pozycja jest oznaczona jako niedostarczona.

Pozostałe maile systemowe:
- zaproszenie użytkownika do platformy,
- potwierdzenie założenia konta,
- reset hasła,
- informacja o zmianie statusu zamówienia (opcjonalnie — hurtownia decyduje które statusy wysyłają maila),
- mail do klienta z zaktualizowanymi ilościami po korekcie przez hurtownię.

Maile powinny być estetyczne, profesjonalne i zgodne z brandingiem hurtowni (logo, kolor, nazwa).

============================================================
12. PLATFORMA I NARZĘDZIA — INFORMACJA KONTEKSTOWA
============================================================

Przy innym projekcie korzystam już z następujących narzędzi:

- Supabase,
- GitHub,
- Resend.com,
- Vercel.

Domena i hosting/DNS są po stronie Cyberfolks.

Nie oznacza to, że te narzędzia muszą być bezwzględnie użyte w tym projekcie. Są to narzędzia, z którymi mam już doświadczenie i które mogą być brane pod uwagę, jeśli będą odpowiednie dla profesjonalnego, skalowalnego i bezpiecznego systemu.

Oczekuję, że ostateczny dobór technologii zostanie dobrany rozsądnie, z uwzględnieniem:
- skalowalności,
- bezpieczeństwa,
- kosztów utrzymania,
- łatwości rozwoju,
- możliwości wdrożenia na produkcję,
- łatwości integracji,
- stabilności,
- profesjonalnego charakteru systemu.

============================================================
13. JAKOŚĆ SYSTEMU
============================================================

To nie ma być szybki prototyp.

Oczekuję profesjonalnego systemu, który będzie można rozwijać komercyjnie.

Wymagania jakościowe:

- nowoczesny wygląd,
- responsywność,
- szybkie działanie,
- czytelna architektura,
- bezpieczeństwo danych,
- separacja danych hurtowni,
- możliwość rozwoju,
- możliwość wdrażania kolejnych hurtowni,
- przygotowanie pod integracje,
- profesjonalny panel administracyjny,
- dobre UX dla klientów hurtowni,
- porządek w kodzie,
- sensowna struktura projektu,
- możliwość pracy etapami.

============================================================
13A. LOGI SYSTEMOWE
============================================================

System powinien rejestrować zdarzenia istotne dla bezpieczeństwa, audytu i diagnozowania problemów.

Logowane zdarzenia:

Konta i logowanie:
- logowanie użytkownika (sukces i nieudana próba),
- wylogowanie,
- reset hasła,
- zmiana hasła,
- utworzenie konta,
- dezaktywacja / usunięcie konta.

Zamówienia:
- złożenie zamówienia przez klienta,
- zmiana statusu zamówienia (kto zmienił, kiedy, z jakiego na jaki),
- korekta ilości przez hurtownię (kto, kiedy, która pozycja, stara i nowa wartość),
- anulowanie zamówienia.

Produkty i ceny:
- dodanie / edycja / usunięcie produktu,
- zmiana ceny produktu lub cennika,
- zmiana stanu magazynowego (kto i kiedy zaktualizował).

Klienci:
- dodanie klienta,
- zmiana danych klienta (w szczególności grupy cenowej i formy płatności),
- dezaktywacja klienta.

Import danych:
- każda operacja importu (kto, kiedy, ile rekordów, czy był błąd).

Minimalne dane każdego logu:
- czas zdarzenia,
- użytkownik (ID + rola),
- hurtownia (ID),
- typ zdarzenia,
- opis zdarzenia / zmienione wartości.

Logi nie są widoczne dla klientów hurtowni. Dostęp mają administratorzy hurtowni i super admin.

============================================================
14. ZAKRES PIERWSZEJ WERSJI PRODUKCYJNEJ
============================================================

Pierwsza wersja systemu powinna zawierać funkcje niezbędne do realnego wdrożenia u pierwszej hurtowni.

Zakres pierwszej wersji:

1. Obsługa wielu hurtowni.
2. Panel Super Admina.
3. Panel Hurtowni.
4. Panel Klienta Hurtowni.
5. Logowanie i role.
6. Branding hurtowni.
7. Produkty.
8. Kategorie.
9. Klienci.
10. Cenniki indywidualne.
11. Koszyk.
12. Składanie zamówień.
13. Historia zamówień.
14. Ponawianie zamówień.
15. Statusy zamówień.
16. Powiadomienia e-mail.
17. Import/eksport danych.
18. Logi systemowe (patrz sekcja 13A).
18a. Formy płatności per klient.
18b. Stany magazynowe (import ręczny + edycja w panelu).
19. Przygotowanie pod przyszłe integracje.
20. Responsywny, nowoczesny interfejs.

============================================================
15. CZEGO NIE TRZEBA ROBIĆ W PIERWSZYM ETAPIE
============================================================

Na pierwszym etapie nie jest konieczne budowanie:

- pełnego systemu magazynowego,
- fakturowania,
- księgowości,
- płatności online,
- aplikacji mobilnej natywnej,
- panelu kierowcy,
- zaawansowanej optymalizacji tras,
- marketplace wielu hurtowni w jednym koszyku,
- komunikatora,
- pełnego ERP.

Te elementy mogą być rozwijane później jako dodatkowe moduły.

============================================================
16. DOCELOWY EFEKT
============================================================

Docelowo system powinien umożliwiać:

1. Dodanie nowej hurtowni do platformy.
2. Nadanie jej własnego brandingu.
3. Udostępnienie jej osobnego adresu/subdomeny.
4. Dodanie produktów i kategorii.
5. Dodanie klientów hurtowni.
6. Ustawienie cen indywidualnych.
7. Zaproszenie klientów do systemu.
8. Składanie zamówień przez klientów.
9. Obsługę zamówień przez hurtownię.
10. Wysyłkę powiadomień e-mail.
11. Eksport zamówień.
12. Przygotowanie systemu pod integracje z obecnym oprogramowaniem hurtowni.
13. Wdrażanie kolejnych hurtowni bez budowania osobnego systemu od zera.

============================================================
17. NAJWAŻNIEJSZE PODSUMOWANIE
============================================================

Projekt ma być profesjonalną platformą B2B dla hurtowni regionalnych.

To ma być jeden skalowalny system, który może obsługiwać wiele hurtowni.

Każda hurtownia ma mieć:
- swoje produkty,
- swoje ceny,
- swoich klientów,
- swoje zamówienia,
- swoje ustawienia,
- swój branding.

Klienci hurtowni mają mieć wygodny, nowoczesny panel do składania zamówień online.

System ma być gotowy do dalszego rozwoju i integracji z obecnym oprogramowaniem hurtowni.

Nie narzucam konkretnej technologii, ale informuję, że w innym projekcie korzystam już z Supabase, GitHub, Resend.com, Vercel, a domena/DNS/hosting są po stronie Cyberfolks. Te narzędzia mogą być uwzględnione, jeśli będą właściwe dla jakościowego i profesjonalnego wdrożenia.

Koniec dokumentu.
