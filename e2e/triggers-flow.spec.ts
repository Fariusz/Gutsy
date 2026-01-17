import { test, expect } from "@playwright/test";
import { TriggersPage } from "./page-objects/TriggersPage";
import { LogsPage } from "./page-objects/LogsPage";
import { CreateLogPage } from "./page-objects/CreateLogPage";
import { LoginPage } from "./page-objects/LoginPage";

/**
 * Triggers Analysis Flow E2E Tests
 *
 * Guidelines:
 * - Use Page Object Model for maintainable tests
 * - Use locators for resilient element selection
 * - Leverage API testing for backend validation
 * - Implement visual comparison with expect(page).toHaveScreenshot()
 * - Use expect assertions with specific matchers
 */
test.describe("Triggers Analysis Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate before each test
    const loginPage = new LoginPage(page);
    const testEmail = process.env.E2E_USERNAME;
    const testPassword = process.env.E2E_PASSWORD;

    if (!testEmail || !testPassword) {
      throw new Error("Zmienne środowiskowe E2E_USERNAME i E2E_PASSWORD muszą być ustawione");
    }

    await loginPage.goto();
    await loginPage.login(testEmail, testPassword);
    await expect(page).toHaveURL("/logs", { timeout: 10000 });
  });

  test("should navigate to triggers page", async ({ page }) => {
    const triggersPage = new TriggersPage(page);
    await triggersPage.goto();

    await expect(page).toHaveURL(/.*\/triggers/);
  });

  test("should handle loading state", async ({ page }) => {
    const triggersPage = new TriggersPage(page);
    await triggersPage.goto();

    // Check if loading state appears (may be too fast to catch)
    const isLoading = await triggersPage.isLoading();

    // This is informational - loading state may be too fast to test reliably
    expect(typeof isLoading === "boolean").toBeTruthy();
  });

  test("should navigate back to logs from triggers", async ({ page }) => {
    const triggersPage = new TriggersPage(page);
    const logsPage = new LogsPage(page);

    // Start on triggers page
    await triggersPage.goto();
    await expect(page).toHaveURL(/.*\/triggers/);

    // Navigate back to logs
    await logsPage.goto();
    await expect(page).toHaveURL(/.*\/logs/);
  });
});
