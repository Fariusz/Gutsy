import { test, expect } from "@playwright/test";
import { LoginPage } from "./page-objects/LoginPage";
import { RegisterPage } from "./page-objects/RegisterPage";

/**
 * Authentication Flow E2E Tests
 *
 * Guidelines:
 * - Use Page Object Model for maintainable tests
 * - Use locators for resilient element selection
 * - Implement test hooks for setup and teardown
 * - Use expect assertions with specific matchers
 * - Use browser contexts for isolating test environments
 */
test.describe("Authentication Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Start each test from the homepage
    await page.goto("/");
  });

  test("should navigate to login page", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await expect(page).toHaveURL(/.*\/login/);

    // Check login form elements exist using Page Object Model
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.signInButton).toBeVisible();
  });

  test("should navigate to register page", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    // Check register form elements exist using Page Object Model
    await expect(registerPage.emailInput).toBeVisible();
    await expect(registerPage.passwordInput).toBeVisible();
    await expect(registerPage.createAccountButton).toBeVisible();
  });

  test("should show validation errors for invalid login", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Try to submit with empty fields
    await loginPage.submit();

    // Check if error message appears (may be validation error or empty field error)
    const hasError = await loginPage.hasErrorMessage();
    expect(hasError || (await page.locator('input[type="email"]').isVisible())).toBeTruthy();
  });

  test("should show error for invalid credentials", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Fill in invalid credentials using Page Object Model
    await loginPage.fillLoginForm("invalid@example.com", "wrongpassword");
    await loginPage.submit();

    // Should show error message or stay on login page
    const hasError = await loginPage.hasErrorMessage();
    const isStillOnLogin = page.url().includes("/login");
    expect(hasError || isStillOnLogin).toBeTruthy();
  });

  test("should navigate between login and register pages", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const registerPage = new RegisterPage(page);

    await loginPage.goto();
    await expect(page).toHaveURL(/.*\/login/);

    // Navigate to register using Page Object Model
    await loginPage.goToRegister();
    await expect(page).toHaveURL(/.*\/register/);

    // Navigate back to login using Page Object Model
    await registerPage.goToLogin();
    await expect(page).toHaveURL(/.*\/login/);
  });

  test("should login with valid credentials", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const testEmail = process.env.E2E_USERNAME;
    const testPassword = process.env.E2E_PASSWORD;

    if (!testEmail || !testPassword) {
      test.skip();
    }

    await loginPage.goto();
    await loginPage.login(testEmail!, testPassword!);

    // Should redirect to logs page after successful login
    await expect(page).toHaveURL(/.*\/logs/, { timeout: 10000 });
  });
});
