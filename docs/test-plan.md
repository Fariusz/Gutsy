Plan Testów dla Aplikacji "Gutsy"

1. Wprowadzenie i Cele Testowania
   1.1. Wprowadzenie
   Niniejszy dokument opisuje plan testów dla aplikacji webowej "Gutsy", której celem jest pomoc użytkownikom w identyfikacji

korelacji między spożywanymi produktami a objawami zdrowotnymi. Plan ten obejmuje strategię, zakres, zasoby i harmonogram działań testowych mających na celu zapewnienie najwyższej jakości, niezawodności i bezpieczeństwa aplikacji przed jej wdrożeniem produkcyjnym.

1.2. Cele Testowania
Główne cele procesu testowego to:

Weryfikacja funkcjonalna: Zapewnienie, że wszystkie funkcjonalności aplikacji, takie jak rejestracja, logowanie, dodawanie wpisów (logów) i analiza korelacji, działają zgodnie ze specyfikacją.
Zapewnienie jakości UI/UX: Sprawdzenie, czy interfejs użytkownika jest intuicyjny, responsywny i zgodny z projektem, zapewniając pozytywne doświadczenia na różnych urządzeniach i przeglądarkach.
Walidacja integralności i bezpieczeństwa danych: Potwierdzenie, że dane użytkowników są bezpiecznie przechowywane i przetwarzane, a mechanizmy takie jak Row Level Security (RLS) w Supabase działają poprawnie.
Ocena wydajności: Weryfikacja, czy aplikacja działa wydajnie pod oczekiwanym obciążeniem, zwłaszcza w kontekście interakcji z bazą danych i API.
Identyfikacja i eliminacja błędów: Wykrycie, zaraportowanie i śledzenie błędów w celu ich naprawy przed wydaniem finalnej wersji produktu. 2. Zakres Testów
2.1. Funkcjonalności objęte testami
Moduł uwierzytelniania:
Rejestracja nowego użytkownika.
Logowanie (poprawne i błędne dane).
Odzyskiwanie hasła.
Wylogowywanie.
Ochrona tras wymagających autoryzacji.
Zarządzanie wpisami (Logami):
Tworzenie nowego wpisu (z danymi o posiłku, składnikach, objawach i opcjonalnym zdjęciu).
Walidacja formularza dodawania wpisu.
Wyświetlanie listy wpisów użytkownika.
Analiza korelacji:
Generowanie i wyświetlanie listy potencjalnych "wyzwalaczy" (triggerów) na podstawie danych z wpisów.
Poprawność działania funkcji RPC get_top_triggers.
API Endpoints:
Testowanie wszystkich punktów końcowych API (/api/\*) pod kątem logiki biznesowej, walidacji danych wejściowych (Zod) i obsługi błędów.
2.2. Funkcjonalności wyłączone z testów
Testy wewnętrznej infrastruktury Supabase i Vercel (zakładamy ich niezawodność).
Szczegółowe testy penetracyjne (mogą być przedmiotem osobnego zlecenia). 3. Typy Testów
Proces testowy zostanie podzielony na następujące typy:

Testy jednostkowe (Unit Tests):
Cel: Weryfikacja poprawności działania pojedynczych funkcji, komponentów React i logiki biznesowej w izolacji.
Zakres: Funkcje pomocnicze (utils), customowe hooki React (hooks), logika usług (services), schematy walidacji Zod (validation).
Testy integracyjne (Integration Tests):
Cel: Sprawdzenie poprawności współpracy między różnymi modułami aplikacji.
Zakres: Interakcja komponentów React z usługami, komunikacja frontendu z API Astro, integracja z Supabase (np. wywołania RPC).
Testy End-to-End (E2E):
Cel: Symulacja rzeczywistych scenariuszy użytkowania aplikacji z perspektywy użytkownika końcowego w środowisku zbliżonym do produkcyjnego.
Zakres: Pełne przepływy użytkownika, takie jak "rejestracja -> logowanie -> dodanie wpisu -> wylogowanie".
Testy manualne i eksploracyjne:
Cel: Identyfikacja błędów, które mogły zostać pominięte w testach automatycznych, oraz ocena ogólnej użyteczności (UX).
Zakres: Cała aplikacja, ze szczególnym uwzględnieniem interfejsu użytkownika, responsywności i obsługi nietypowych przypadków.
Testy kompatybilności (Cross-Browser Testing):
Cel: Zapewnienie spójnego wyglądu i działania aplikacji na najpopularniejszych przeglądarkach internetowych.
Zakres: Testy manualne kluczowych funkcjonalności na przeglądarkach Chrome, Firefox, Safari i Edge. 4. Scenariusze Testowe dla Kluczowych Funkcjonalności
4.1. Scenariusz: Rejestracja i pierwsze logowanie
Użytkownik przechodzi na stronę /register.
Wypełnia formularz poprawnymi danymi (email, hasło).
System tworzy konto użytkownika w Supabase Auth.
Użytkownik zostaje przekierowany na stronę główną (/) jako zalogowany.
Użytkownik wylogowuje się.
Użytkownik przechodzi na stronę /login i loguje się przy użyciu nowo utworzonych danych.
System pomyślnie uwierzytelnia użytkownika.
4.2. Scenariusz: Dodawanie wpisu (Logu)
Zalogowany użytkownik przechodzi na stronę główną.
Klika przycisk dodawania nowego wpisu.
Wypełnia formularz, podając składniki, objawy i opcjonalnie dodając zdjęcie.
System waliduje dane wejściowe (np. pole składników nie może być puste).
Po pomyślnej walidacji, dane zostają zapisane w tabeli logs w bazie Supabase.
Nowy wpis pojawia się na liście wpisów użytkownika.
4.3. Scenariusz: Analiza "Wyzwalaczy" (Triggers)
Zalogowany użytkownik, który dodał co najmniej kilka wpisów z różnymi składnikami i objawami, przechodzi na stronę /triggers.
Aplikacja wywołuje endpoint API, który z kolei uruchamia funkcję RPC get_top_triggers w Supabase.
Na stronie wyświetla się posortowana lista składników (wyzwalaczy) wraz z informacjami o częstotliwości ich występowania z objawami.
System poprawnie obsługuje przypadek, gdy użytkownik nie ma jeszcze wystarczającej ilości danych do analizy. 5. Środowisko Testowe
Środowisko deweloperskie (lokalne): Używane do uruchamiania testów jednostkowych i integracyjnych podczas rozwoju.
Środowisko testowe (Staging): Oddzielna instancja aplikacji wdrożona na Vercel, połączona z dedykowaną instancją (lub projektem) Supabase. Na tym środowisku będą przeprowadzane testy E2E i manualne. Baza danych na tym środowisku będzie regularnie czyszczona i wypełniana danymi testowymi (seed.sql).
Przeglądarki:
Google Chrome (najnowsza wersja)
Mozilla Firefox (najnowsza wersja)
Apple Safari (najnowsza wersja)
Microsoft Edge (najnowsza wersja) 6. Narzędzia do Testowania
Framework do testów jednostkowych i integracyjnych: Vitest
Framework do testów E2E: Playwright
Zarządzanie zadaniami i raportowanie błędów: GitHub Issues
CI/CD (uruchamianie testów automatycznych): GitHub Actions 7. Harmonogram Testów
Faza Testów Planowany Czas Rozpoczęcia Planowany Czas Zakończenia Odpowiedzialność
Implementacja testów jednostkowych Równolegle z developmentem Ciągły proces Deweloperzy
Implementacja testów integracyjnych Równolegle z developmentem Ciągły proces Deweloperzy
Implementacja testów E2E (główne ścieżki) Tydzień 1 Tydzień 2 Inżynier QA
Faza testów manualnych i eksploracyjnych Tydzień 3 Tydzień 4 Inżynier QA
Testy regresji i weryfikacja poprawek Tydzień 4 Przed wdrożeniem Inżynier QA
Testy akceptacyjne (UAT) Tydzień 5 Tydzień 5 Product Owner
Harmonogram jest orientacyjny i zakłada cykl deweloperski trwający 5 tygodni.

8. Kryteria Akceptacji Testów
   8.1. Kryteria wejścia
   Zakończony rozwój funkcjonalności przewidzianych w danym sprincie.
   Dostępne i skonfigurowane środowisko testowe.
   Pomyślne przejście wszystkich testów jednostkowych i integracyjnych w pipeline CI/CD.
   8.2. Kryteria wyjścia (zakończenia testów)
   100% zdefiniowanych scenariuszy testowych zostało wykonanych.
   Wszystkie testy automatyczne (jednostkowe, integracyjne, E2E) kończą się sukcesem.
   Brak nierozwiązanych błędów krytycznych i blokujących.
   Wszystkie błędy o wysokim priorytecie zostały rozwiązane i zweryfikowane.
   Liczba znanych błędów o niskim priorytecie jest zaakceptowana przez Product Ownera.
   Osiągnięto pokrycie kodu testami jednostkowymi na poziomie co najmniej 80%.
9. Role i Odpowiedzialności
   Deweloperzy:
   Pisanie testów jednostkowych i integracyjnych dla tworzonego kodu.
   Naprawianie błędów zgłoszonych przez zespół QA.
   Utrzymywanie środowiska deweloperskiego i CI/CD.
   Inżynier QA:
   Tworzenie i utrzymanie planu testów.
   Projektowanie i implementacja testów E2E.
   Wykonywanie testów manualnych i eksploracyjnych.
   Raportowanie, klasyfikacja i weryfikacja błędów.
   Przygotowanie raportów z postępu i wyników testów.
   Product Owner:
   Definiowanie wymagań i kryteriów akceptacji.
   Udział w testach akceptacyjnych (UAT).
   Podejmowanie decyzji o priorytetach naprawy błędów.
10. Procedury Raportowania Błędów
    Wszystkie zidentyfikowane błędy będą raportowane jako "Issues" w repozytorium GitHub projektu. Każdy raport powinien zawierać:

Tytuł: Zwięzły i jednoznaczny opis problemu.
Opis:
Kroki do odtworzenia (Steps to Reproduce): Szczegółowa, numerowana lista kroków prowadzących do wystąpienia błędu.
Obserwowany rezultat (Actual Result): Co się stało po wykonaniu kroków.
Oczekiwany rezultat (Expected Result): Co powinno się stać.
Środowisko: Wersja przeglądarki, system operacyjny, na którym wystąpił błąd.
Zrzuty ekranu/Nagrania wideo: Dołączone w celu lepszej ilustracji problemu.
Priorytet:
Krytyczny (Critical): Błąd blokujący kluczowe funkcjonalności, uniemożliwiający dalsze testy.
Wysoki (High): Błąd w głównej funkcjonalności, który ma znaczący wpływ na działanie aplikacji, ale istnieje obejście.
Średni (Medium): Błąd w funkcjonalności drugorzędnej lub problem UI.
Niski (Low): Drobny problem estetyczny, literówka lub sugestia usprawnienia.
Etykiety (Labels): Np. bug, ui, auth, performance.
