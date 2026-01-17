# Testy E2E Playwright

Dokumentacja testów end-to-end (E2E) dla aplikacji Gutsy.

## Spis treści

- [Przegląd](#przegląd)
- [Konfiguracja](#konfiguracja)
- [Uruchamianie testów](#uruchamianie-testów)
- [Struktura projektu](#struktura-projektu)
- [Opis testów](#opis-testów)
- [Page Object Model](#page-object-model)
- [Zmienne środowiskowe](#zmienne-środowiskowe)
- [Best practices](#best-practices)

## Przegląd

Testy E2E w projekcie Gutsy używają frameworka Playwright do automatyzacji testów w przeglądarce. Testy weryfikują pełne flow użytkownika, od logowania po tworzenie i zarządzanie logami żywieniowymi.

### Technologie

- **Playwright** - Framework do testów E2E
- **TypeScript** - Język programowania
- **Page Object Model** - Wzorzec projektowy dla organizacji testów

## Konfiguracja

### Wymagania wstępne

1. Node.js (wersja zgodna z `.nvmrc`)
2. Zainstalowane zależności: `npm install`
3. Konto testowe w aplikacji

### Instalacja Playwright

```bash
# Instalacja Playwright browsers
npx playwright install chromium
```

### Zmienne środowiskowe

Testy wymagają następujących zmiennych środowiskowych:

```bash
E2E_USERNAME=twoj-email@example.com
E2E_PASSWORD=twoje-haslo
```

#### Konfiguracja zmiennych środowiskowych

**Windows (PowerShell):**

```powershell
$env:E2E_USERNAME="test@example.com"
$env:E2E_PASSWORD="haslo123"
```

**Windows (CMD):**

```cmd
set E2E_USERNAME=test@example.com
set E2E_PASSWORD=haslo123
```

**Linux/macOS:**

```bash
export E2E_USERNAME=test@example.com
export E2E_PASSWORD=haslo123
```

**Plik .env (opcjonalnie):**
Możesz utworzyć plik `.env.test` w katalogu głównym:

```
E2E_USERNAME=test@example.com
E2E_PASSWORD=haslo123
```

## Uruchamianie testów

### Wszystkie testy

```bash
# Uruchom wszystkie testy E2E
npm run test:e2e

# Uruchom testy w trybie UI (interaktywnym)
npx playwright test --ui

# Uruchom testy z widoczną przeglądarką
npx playwright test --headed
```

### Konkretny plik testowy

```bash
# Uruchom tylko test add-log
npx playwright test e2e/add-log.spec.ts

# Uruchom konkretny test case
npx playwright test e2e/add-log.spec.ts -g "powinien pozwolić użytkownikowi dodać nowy wpis"
```

### Debugging

```bash
# Uruchom test w trybie debug
npx playwright test e2e/add-log.spec.ts --debug

# Pokaż raport HTML po testach
npx playwright show-report

# Pokaż trace po nieudanych testach
npx playwright show-trace
```

## Struktura projektu

```
e2e/
├── page-objects/           # Page Object Model classes
│   ├── LoginPage.ts       # Strona logowania
│   ├── HomePage.ts        # Strona główna
│   └── CreateLogPage.ts   # Strona tworzenia loga
├── pages/                 # Alternatywne POM (legacy)
├── add-log.spec.ts        # Test dodawania loga
├── auth-flow.spec.ts      # Test przepływu autentykacji
├── create-log.spec.ts     # Test tworzenia loga
├── helpers.ts             # Funkcje pomocnicze
└── README.md              # Ten plik
```

## Opis testów

### add-log.spec.ts

Test weryfikuje pełny scenariusz dodawania nowego wpisu żywieniowego przez użytkownika.

#### Test Cases

**1. Dodawanie wpisu z jedzeniem i objawami**

Sprawdza pełny happy path:

- Logowanie użytkownika
- Nawigację do formularza tworzenia loga
- Wypełnienie formularza (data, składniki, notatki)
- Dodanie objawu z określoną intensywnością
- Weryfikację, czy log pojawia się na liście

```typescript
test("powinien pozwolić użytkownikowi dodać nowy wpis z jedzeniem i objawami", async ({ page }) => {
  // Arrange
  const logData = {
    date: currentDate,
    ingredients: "Mleko, Jajka, Cukier",
    notes: "Testowy wpis z Playwright",
    symptom: "Abdominal Pain",
    severity: "3 - Moderate",
  };

  // Act & Assert
  // ... pełna implementacja w pliku
});
```

**2. Walidacja pustego formularza**

Sprawdza, czy aplikacja:

- Blokuje tworzenie loga bez wymaganych danych
- Wyświetla odpowiednie komunikaty błędów
- Utrzymuje użytkownika na stronie formularza

**3. Dodawanie wpisu tylko ze składnikami**

Weryfikuje możliwość utworzenia loga bez objawów:

- Wypełnienie tylko podstawowych pól (data, składniki, notatki)
- Pomijanie sekcji objawów
- Pomyślne utworzenie wpisu

#### Dane testowe

Test używa aktualnej daty i realistycznych danych:

- **Data**: Bieżący dzień (format ISO)
- **Składniki**: Lista produktów spożywczych
- **Notatki**: Opisowy komentarz
- **Objaw**: Wybór z dostępnych w systemie
- **Intensywność**: Skala 1-5

## Page Object Model

### Wzorzec organizacji testów

Page Object Model (POM) to wzorzec projektowy, który:

- Hermetyzuje logikę UI w dedykowanych klasach
- Zwiększa czytelność testów
- Ułatwia utrzymanie przy zmianach w UI
- Promuje reużywalność kodu

### Klasy POM

#### LoginPage

```typescript
class LoginPage {
  async login(email: string, password: string);
  async goto();
}
```

Odpowiada za:

- Nawigację do strony logowania
- Wypełnienie formularza logowania
- Kliknięcie przycisku "Sign in"

#### HomePage

```typescript
class HomePage {
  async clickNewLog();
  async goto();
}
```

Odpowiada za:

- Nawigację do strony głównej
- Kliknięcie przycisku "New Log" (header lub FAB)

#### CreateLogPage

```typescript
class CreateLogPage {
  async fillLogDetails(date: string, ingredients: string, notes?: string);
  async addSymptom(symptomName: string, severity: string);
  async createLog();
  async goto();
}
```

Odpowiada za:

- Wypełnienie formularza tworzenia loga
- Dodawanie objawów
- Zatwierdzenie formularza

### Lokatory data-test-id

Wszystkie elementy w POM używają atrybutów `data-test-id` dla stabilnego lokalizowania:

```typescript
this.emailInput = page.getByTestId("login-email-input");
this.passwordInput = page.getByTestId("login-password-input");
this.signInButton = page.getByTestId("login-submit-button");
```

**Zalety:**

- Niezależność od struktury DOM
- Odporność na zmiany stylów CSS
- Stabilność przy refaktoryzacji UI

## Best Practices

### 1. Arrange-Act-Assert Pattern

Każdy test powinien być podzielony na trzy sekcje:

```typescript
test("opis testu", async ({ page }) => {
  // ARRANGE - Przygotowanie danych i stanu
  const loginPage = new LoginPage(page);
  const testData = {
    /* ... */
  };

  // ACT - Wykonanie akcji
  await loginPage.login(email, password);
  await createLogPage.fillLogDetails(/* ... */);

  // ASSERT - Weryfikacja rezultatów
  await expect(page).toHaveURL("/logs");
  await expect(page.getByText(testData.ingredients)).toBeVisible();
});
```

### 2. Używanie timeout dla asercji

```typescript
await expect(page).toHaveURL("/logs", { timeout: 10000 });
await expect(element).toBeVisible({ timeout: 5000 });
```

### 3. Walidacja zmiennych środowiskowych

```typescript
if (!testEmail || !testPassword) {
  throw new Error("Zmienne środowiskowe E2E_USERNAME i E2E_PASSWORD muszą być ustawione");
}
```

### 4. Używanie aktualnych dat

```typescript
const currentDate = new Date().toISOString().split("T")[0];
```

### 5. Obsługa wielu formatów (i18n)

```typescript
const symptomVisible = await page
  .getByText(/abdominal pain|ból brzucha/i)
  .first()
  .isVisible()
  .catch(() => false);
```

### 6. Komentarze w języku polskim

Dla polskiego zespołu używamy polskich komentarzy:

```typescript
// Krok 1: Przejdź na stronę logowania i zaloguj się
await loginPage.goto();
await loginPage.login(testEmail, testPassword);
```

## Debugowanie

### Playwright Inspector

```bash
npx playwright test --debug
```

Pozwala na:

- Krokowe wykonywanie testu
- Inspekcję lokatorów
- Podgląd konsoli

### Trace Viewer

Po niepowodzeniu testu:

```bash
npx playwright show-trace trace.zip
```

Pokazuje:

- Timeline akcji
- Screenshoty
- Logi konsoli
- Network requests

### Screenshots i Videos

Konfiguracja w `playwright.config.ts`:

```typescript
use: {
  screenshot: "only-on-failure",
  video: "retain-on-failure",
}
```

## Troubleshooting

### Problem: "E2E_USERNAME i E2E_PASSWORD muszą być ustawione"

**Rozwiązanie:**
Ustaw zmienne środowiskowe przed uruchomieniem testów (patrz sekcja [Zmienne środowiskowe](#zmienne-środowiskowe))

### Problem: Timeout podczas logowania

**Rozwiązanie:**

- Sprawdź, czy aplikacja działa na `http://localhost:3000`
- Sprawdź, czy dane logowania są poprawne
- Zwiększ timeout w konfiguracji

### Problem: Element nie jest widoczny

**Rozwiązanie:**

- Sprawdź, czy atrybut `data-test-id` istnieje w komponencie
- Użyj `--headed` aby zobaczyć, co dzieje się w przeglądarce
- Sprawdź czy element nie jest ukryty przez CSS lub animacje

### Problem: Test przechodzi lokalnie, ale nie na CI

**Rozwiązanie:**

- Upewnij się, że zmienne środowiskowe są ustawione w CI
- Sprawdź timeouty - CI może być wolniejsze
- Sprawdź czy `webServer` jest poprawnie skonfigurowany

## Dodawanie nowych testów

### Szablon nowego testu

```typescript
import { test, expect } from "@playwright/test";
import { LoginPage } from "./page-objects/LoginPage";
// ... inne POM

test.describe("Nazwa grupy testów", () => {
  test("powinien robić coś konkretnego", async ({ page }) => {
    // ARRANGE
    const loginPage = new LoginPage(page);

    // ACT
    await loginPage.goto();
    // ... akcje

    // ASSERT
    await expect(page).toHaveURL("/expected-url");
  });
});
```

### Checklist dla nowego testu

- [ ] Używa Page Object Model
- [ ] Ma jasny, opisowy tytuł
- [ ] Stosuje pattern Arrange-Act-Assert
- [ ] Weryfikuje zmienne środowiskowe (jeśli potrzebne)
- [ ] Ma odpowiednie timeouty
- [ ] Jest dobrze skomentowany
- [ ] Nie ma hardcoded'owanych wartości
- [ ] Czyści po sobie (jeśli tworzy dane)

## Więcej informacji

- [Dokumentacja Playwright](https://playwright.dev)
- [Page Object Model best practices](https://playwright.dev/docs/pom)
- [Test hooks](https://playwright.dev/docs/test-fixtures)
- [Debugging](https://playwright.dev/docs/debug)
