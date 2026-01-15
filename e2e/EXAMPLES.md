# 📚 Przykłady użycia Page Object Model

Praktyczne przykłady użycia klas POM w testach E2E dla aplikacji Gutsy.

## Spis treści

- [Podstawowe użycie](#podstawowe-użycie)
- [LoginPage - Przykłady](#loginpage---przykłady)
- [HomePage - Przykłady](#homepage---przykłady)
- [CreateLogPage - Przykłady](#createlogpage---przykłady)
- [Kombinowanie POM](#kombinowanie-pom)
- [Zaawansowane scenariusze](#zaawansowane-scenariusze)
- [Best Practices](#best-practices)

## Podstawowe użycie

### Minimalistyczny test logowania

```typescript
import { test, expect } from "@playwright/test";
import { LoginPage } from "./page-objects/LoginPage";

test("użytkownik może się zalogować", async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.goto();
  await loginPage.login("user@example.com", "password123");

  await expect(page).toHaveURL("/logs");
});
```

### Pełny flow z asercjami

```typescript
import { test, expect } from "@playwright/test";
import { LoginPage } from "./page-objects/LoginPage";

test("pełny flow logowania z weryfikacją", async ({ page }) => {
  const loginPage = new LoginPage(page);

  // Przejdź na stronę
  await loginPage.goto();
  await expect(page).toHaveURL("/login");

  // Sprawdź czy formularz jest widoczny
  await expect(loginPage.emailInput).toBeVisible();
  await expect(loginPage.passwordInput).toBeVisible();
  await expect(loginPage.signInButton).toBeVisible();

  // Zaloguj się
  await loginPage.login("user@example.com", "password123");

  // Sprawdź przekierowanie
  await expect(page).toHaveURL("/logs", { timeout: 10000 });
});
```

## LoginPage - Przykłady

### Logowanie z zmiennymi środowiskowymi

```typescript
test("logowanie z env variables", async ({ page }) => {
  const loginPage = new LoginPage(page);

  const email = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;

  if (!email || !password) {
    throw new Error("Brak zmiennych środowiskowych E2E_USERNAME i E2E_PASSWORD");
  }

  await loginPage.goto();
  await loginPage.login(email, password);

  await expect(page).toHaveURL("/logs");
});
```

### Test błędnego logowania

```typescript
test("błędne dane logowania", async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.goto();
  await loginPage.login("wrong@example.com", "wrongpassword");

  // Sprawdź czy pozostajemy na stronie logowania
  await expect(page).toHaveURL("/login");

  // Sprawdź komunikat o błędzie (dostosuj do swojej aplikacji)
  await expect(page.getByText(/invalid credentials|nieprawidłowe dane/i)).toBeVisible();
});
```

### Test pustego formularza

```typescript
test("walidacja pustego formularza logowania", async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.goto();

  // Kliknij submit bez wypełniania
  await loginPage.signInButton.click();

  // Sprawdź HTML5 validation lub komunikaty błędów
  await expect(loginPage.emailInput).toHaveAttribute("required");
  await expect(loginPage.passwordInput).toHaveAttribute("required");
});
```

## HomePage - Przykłady

### Nawigacja do nowego loga

```typescript
test("kliknięcie New Log z strony głównej", async ({ page }) => {
  const homePage = new HomePage(page);

  // Zakładamy, że użytkownik jest już zalogowany
  await homePage.goto();

  // Kliknij przycisk New Log
  await homePage.clickNewLog();

  // Sprawdź przekierowanie
  await expect(page).toHaveURL("/logs/new");
});
```

### Test responsywności (Header vs FAB)

```typescript
test("przycisk New Log dostosowuje się do rozmiaru ekranu", async ({ page }) => {
  const homePage = new HomePage(page);

  await homePage.goto();

  // Desktop - header button powinien być widoczny
  await page.setViewportSize({ width: 1920, height: 1080 });
  await expect(homePage.newLogButtonHeader).toBeVisible();

  // Mobile - FAB powinien być widoczny
  await page.setViewportSize({ width: 375, height: 667 });
  // clickNewLog() automatycznie wybiera właściwy przycisk
  await homePage.clickNewLog();

  await expect(page).toHaveURL("/logs/new");
});
```

## CreateLogPage - Przykłady

### Tworzenie loga z minimalnymi danymi

```typescript
test("utwórz log tylko z wymaganymi polami", async ({ page }) => {
  const createLogPage = new CreateLogPage(page);

  await createLogPage.goto();

  const today = new Date().toISOString().split("T")[0];

  await createLogPage.fillLogDetails(today, "Jabłko, Banan");

  await createLogPage.createLog();

  await expect(page).toHaveURL("/logs");
  await expect(page.getByText("Jabłko, Banan")).toBeVisible();
});
```

### Tworzenie loga z wszystkimi polami

```typescript
test("utwórz log ze wszystkimi danymi", async ({ page }) => {
  const createLogPage = new CreateLogPage(page);

  await createLogPage.goto();

  const logData = {
    date: "2024-07-30",
    ingredients: "Mleko, Jajka, Mąka, Cukier",
    notes: "Naleśniki na śniadanie - pyszne!",
  };

  await createLogPage.fillLogDetails(logData.date, logData.ingredients, logData.notes);

  await createLogPage.createLog();

  await expect(page).toHaveURL("/logs");
  await expect(page.getByText(logData.ingredients)).toBeVisible();
  await expect(page.getByText(logData.notes)).toBeVisible();
});
```

### Dodawanie objawów

```typescript
test("dodaj log z objawami", async ({ page }) => {
  const createLogPage = new CreateLogPage(page);

  await createLogPage.goto();

  const today = new Date().toISOString().split("T")[0];

  // Wypełnij podstawowe dane
  await createLogPage.fillLogDetails(today, "Pomidory, Bazylia", "Włoska sałatka");

  // Dodaj objaw
  await createLogPage.addSymptom("Abdominal Pain", "3 - Moderate");

  // Opcjonalnie: dodaj więcej objawów
  await createLogPage.addSymptom("Headache", "2 - Mild");

  await createLogPage.createLog();

  await expect(page).toHaveURL("/logs");
});
```

### Walidacja formularza

```typescript
test("walidacja formularza tworzenia loga", async ({ page }) => {
  const createLogPage = new CreateLogPage(page);

  await createLogPage.goto();

  // Spróbuj utworzyć log bez wypełnienia formularza
  await createLogPage.createLog();

  // Użytkownik powinien pozostać na stronie
  await expect(page).toHaveURL("/logs/new");

  // Pole składników powinno być wymagane
  await expect(createLogPage.ingredientsInput).toHaveAttribute("required");
});
```

## Kombinowanie POM

### Pełny flow: Login → Navigate → Create

```typescript
test("pełny flow użytkownika", async ({ page }) => {
  const loginPage = new LoginPage(page);
  const homePage = new HomePage(page);
  const createLogPage = new CreateLogPage(page);

  // KROK 1: Zaloguj się
  await loginPage.goto();
  await loginPage.login(process.env.E2E_USERNAME!, process.env.E2E_PASSWORD!);
  await expect(page).toHaveURL("/logs");

  // KROK 2: Nawiguj do tworzenia loga
  await homePage.clickNewLog();
  await expect(page).toHaveURL("/logs/new");

  // KROK 3: Utwórz log
  const today = new Date().toISOString().split("T")[0];
  await createLogPage.fillLogDetails(today, "Testowy wpis", "Notatka testowa");
  await createLogPage.addSymptom("Nausea", "4 - Severe");
  await createLogPage.createLog();

  // KROK 4: Weryfikacja
  await expect(page).toHaveURL("/logs");
  await expect(page.getByText("Testowy wpis")).toBeVisible();
});
```

### Reużywalna funkcja logowania

```typescript
// Helper function
async function loginAsTestUser(page: Page) {
  const loginPage = new LoginPage(page);

  const email = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;

  if (!email || !password) {
    throw new Error("Brak zmiennych środowiskowych");
  }

  await loginPage.goto();
  await loginPage.login(email, password);
  await expect(page).toHaveURL("/logs", { timeout: 10000 });
}

// Użycie w teście
test("szybkie tworzenie loga", async ({ page }) => {
  const createLogPage = new CreateLogPage(page);

  // Używamy helper function
  await loginAsTestUser(page);

  // Przechodzimy bezpośrednio do tworzenia
  await createLogPage.goto();
  await createLogPage.fillLogDetails("2024-07-30", "Apple");
  await createLogPage.createLog();

  await expect(page).toHaveURL("/logs");
});
```

## Zaawansowane scenariusze

### Test z hooks (before/after)

```typescript
test.describe("Logs Management", () => {
  test.beforeEach(async ({ page }) => {
    // Zaloguj się przed każdym testem
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(process.env.E2E_USERNAME!, process.env.E2E_PASSWORD!);
    await expect(page).toHaveURL("/logs");
  });

  test("utwórz pierwszy log", async ({ page }) => {
    const homePage = new HomePage(page);
    const createLogPage = new CreateLogPage(page);

    await homePage.clickNewLog();

    const today = new Date().toISOString().split("T")[0];
    await createLogPage.fillLogDetails(today, "Test Ingredient 1");
    await createLogPage.createLog();

    await expect(page).toHaveURL("/logs");
  });

  test("utwórz drugi log", async ({ page }) => {
    const homePage = new HomePage(page);
    const createLogPage = new CreateLogPage(page);

    await homePage.clickNewLog();

    const today = new Date().toISOString().split("T")[0];
    await createLogPage.fillLogDetails(today, "Test Ingredient 2");
    await createLogPage.createLog();

    await expect(page).toHaveURL("/logs");
  });
});
```

### Test z parametrami (data-driven)

```typescript
const testData = [
  {
    ingredients: "Mleko",
    notes: "Śniadanie",
    symptom: "Nausea",
    severity: "2 - Mild",
  },
  {
    ingredients: "Jajka, Bekon",
    notes: "Brunch",
    symptom: "Abdominal Pain",
    severity: "3 - Moderate",
  },
  {
    ingredients: "Kurczak, Ryż",
    notes: "Obiad",
    symptom: "Headache",
    severity: "1 - Very Mild",
  },
];

for (const data of testData) {
  test(`utwórz log: ${data.ingredients}`, async ({ page }) => {
    const loginPage = new LoginPage(page);
    const createLogPage = new CreateLogPage(page);

    await loginPage.goto();
    await loginPage.login(process.env.E2E_USERNAME!, process.env.E2E_PASSWORD!);

    await createLogPage.goto();

    const today = new Date().toISOString().split("T")[0];
    await createLogPage.fillLogDetails(today, data.ingredients, data.notes);
    await createLogPage.addSymptom(data.symptom, data.severity);
    await createLogPage.createLog();

    await expect(page).toHaveURL("/logs");
    await expect(page.getByText(data.ingredients)).toBeVisible();
  });
}
```

### Test z retry logic

```typescript
test("utwórz log z ponawianiem", async ({ page }) => {
  const createLogPage = new CreateLogPage(page);

  await createLogPage.goto();

  const today = new Date().toISOString().split("T")[0];
  await createLogPage.fillLogDetails(today, "Retry Test");

  // Retry mechanizm na wypadek przejściowych błędów
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      await createLogPage.createLog();
      await expect(page).toHaveURL("/logs", { timeout: 5000 });
      break;
    } catch (error) {
      attempts++;
      if (attempts === maxAttempts) throw error;
      console.log(`Próba ${attempts} nie powiodła się, ponawianie...`);
      await page.reload();
    }
  }

  await expect(page.getByText("Retry Test")).toBeVisible();
});
```

## Best Practices

### ✅ DO - Dobre praktyki

```typescript
// 1. Używaj zmiennych środowiskowych dla danych wrażliwych
const email = process.env.E2E_USERNAME;
const password = process.env.E2E_PASSWORD;

// 2. Waliduj dane przed użyciem
if (!email || !password) {
  throw new Error("Missing credentials");
}

// 3. Używaj aktualnych dat
const today = new Date().toISOString().split("T")[0];

// 4. Dodawaj timeouty dla asercji
await expect(page).toHaveURL("/logs", { timeout: 10000 });

// 5. Używaj opisowych nazw testów
test("użytkownik może dodać log z objawami i zobaczyć go na liście", async ({ page }) => {
  // ...
});

// 6. Komentuj kroki w teście
// ARRANGE
const loginPage = new LoginPage(page);

// ACT
await loginPage.login(email, password);

// ASSERT
await expect(page).toHaveURL("/logs");
```

### ❌ DON'T - Złe praktyki

```typescript
// 1. NIE hardcodeuj danych logowania
await loginPage.login("user@example.com", "password123"); // ❌

// 2. NIE używaj bezpośrednich selektorów w testach
await page.click("button.submit"); // ❌
await createLogPage.createLog(); // ✅

// 3. NIE ignoruj błędów
try {
  await createLogPage.createLog();
} catch {
  // puste catch ❌
}

// 4. NIE używaj sleep zamiast waitFor
await page.waitForTimeout(5000); // ❌
await expect(element).toBeVisible(); // ✅

// 5. NIE duplikuj kodu
// Zamiast kopiować login do każdego testu, utwórz helper function ✅
```

### Czysty kod w testach

```typescript
// ZAMIAST tego:
test("test 1", async ({ page }) => {
  await page.goto("/login");
  await page.fill('[data-test-id="login-email-input"]', "user@example.com");
  await page.fill('[data-test-id="login-password-input"]', "pass");
  await page.click('[data-test-id="login-submit-button"]');
  // ...
});

// UŻYJ tego:
test("test 1", async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login("user@example.com", "pass");
  // ...
});
```

## Podsumowanie

- **Zawsze używaj Page Object Model** - zwiększa czytelność i łatwość utrzymania
- **Używaj data-test-id** - zapewnia stabilność lokatorów
- **Stosuj Arrange-Act-Assert** - jasna struktura testów
- **Dodawaj timeouty** - unikaj flaky tests
- **Waliduj dane** - sprawdzaj zmienne środowiskowe
- **Komentuj testy** - dokumentuj intent, nie implementation

---

Więcej informacji: [README.md](./README.md) | [QUICKSTART.md](./QUICKSTART.md)
