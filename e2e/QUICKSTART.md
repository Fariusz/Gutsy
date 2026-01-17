# 🚀 Szybki Start - Testy E2E

Przewodnik szybkiego startu dla testów Playwright w projekcie Gutsy.

## ⚡ 5 minut do pierwszego testu

### 1. Zainstaluj Playwright

```bash
npx playwright install chromium
```

### 2. Skonfiguruj zmienne środowiskowe

**Windows (PowerShell):**

```powershell
$env:E2E_USERNAME="twoj-email@example.com"
$env:E2E_PASSWORD="twoje-haslo"
```

**Linux/macOS:**

```bash
export E2E_USERNAME="twoj-email@example.com"
export E2E_PASSWORD="twoje-haslo"
```

**Lub stwórz plik `.env.test`:**

```bash
cp .env.test.example .env.test
# Edytuj .env.test i wypełnij danymi
```

### 3. Uruchom serwer dev

```bash
npm run dev:e2e
```

### 4. Uruchom testy (w nowym terminalu)

```bash
# Wszystkie testy
npm run test:e2e

# Konkretny test
npx playwright test e2e/add-log.spec.ts

# Tryb interaktywny
npm run test:e2e:ui
```

## 📋 Dostępne skrypty

```bash
# Standardowe uruchomienie
npm run test:e2e

# Tryb UI (interaktywny)
npm run test:e2e:ui

# Z widoczną przeglądarką
npm run test:e2e:headed

# Debug mode
npx playwright test --debug

# Pokaż raport
npx playwright show-report
```

## 🎯 Twój pierwszy test

Przykład użycia istniejącego testu:

```typescript
import { test, expect } from "@playwright/test";
import { LoginPage } from "./page-objects/LoginPage";

test("mój pierwszy test", async ({ page }) => {
  // Użyj Page Object Model
  const loginPage = new LoginPage(page);

  await loginPage.goto();
  await loginPage.login(process.env.E2E_USERNAME!, process.env.E2E_PASSWORD!);

  // Sprawdź przekierowanie
  await expect(page).toHaveURL("/logs");
});
```

## 🔍 Debugging

### Zobacz co się dzieje w przeglądarce

```bash
npm run test:e2e:headed
```

### Debuguj krok po kroku

```bash
npx playwright test --debug
```

### Sprawdź trace po błędzie

```bash
npx playwright show-report
# Kliknij na nieudany test → Zobacz trace
```

## ❓ Częste problemy

### ❌ "E2E_USERNAME i E2E_PASSWORD muszą być ustawione"

**Rozwiązanie:** Ustaw zmienne środowiskowe przed uruchomieniem testów (patrz krok 2)

### ❌ Timeout podczas logowania

**Sprawdź:**

- Czy aplikacja działa na `http://localhost:3000`
- Czy dane logowania są poprawne
- Czy konto testowe istnieje w bazie danych

```bash
# Sprawdź czy serwer działa
curl http://localhost:3000
```

### ❌ "Browser not found"

```bash
# Zainstaluj ponownie
npx playwright install chromium
```

### ❌ Element nie jest widoczny

**Użyj mode headed aby zobaczyć:**

```bash
npx playwright test --headed --debug
```

## 📚 Następne kroki

1. **Przeczytaj dokumentację** → [e2e/README.md](./README.md)
2. **Zobacz przykłady** → Pliki `*.spec.ts` w katalogu `e2e/`
3. **Poznaj POM** → Katalog `e2e/page-objects/`
4. **Napisz własny test** → Użyj szablonu z README

## 💡 Przydatne wskazówki

### Uruchom tylko jeden test

```bash
npx playwright test -g "powinien pozwolić użytkownikowi dodać"
```

### Zobacz screenshoty po błędach

Automatycznie zapisywane w `test-results/`

### Generuj kod testu

```bash
npx playwright codegen http://localhost:3000
```

### Sprawdź które selektory działają

```bash
npx playwright test --debug
# W inspektorze wpisz: page.getByTestId("login-email-input")
```

## 🎓 Wzorzec Arrange-Act-Assert

Każdy test powinien mieć strukturę:

```typescript
test("opis testu", async ({ page }) => {
  // ===== ARRANGE =====
  // Przygotuj dane i obiekty
  const loginPage = new LoginPage(page);
  const testData = {
    /* ... */
  };

  // ===== ACT =====
  // Wykonaj akcje
  await loginPage.login(email, password);

  // ===== ASSERT =====
  // Sprawdź rezultat
  await expect(page).toHaveURL("/expected");
});
```

## 📞 Potrzebujesz pomocy?

- 📖 Pełna dokumentacja: [README.md](./README.md)
- 🌐 Playwright Docs: https://playwright.dev
- 🐛 Debugging Guide: https://playwright.dev/docs/debug

---

**Gotowy do testowania? Uruchom:**

```bash
npm run test:e2e:ui
```
