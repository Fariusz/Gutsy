import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";

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

  test("should navigate to login page from home", async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Navigate to login page
    await page.getByText("Log in").click();
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

    // Should show validation messages
    // Note: Adjust based on your actual error display implementation
    const hasError = await loginPage.hasErrorMessage();
    expect(hasError).toBeTruthy();
  });

  test("should show error for invalid credentials", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Fill in invalid credentials using Page Object Model
    await loginPage.login("invalid@example.com", "wrongpassword");

    // Should show error message
    const hasError = await loginPage.hasErrorMessage();
    expect(hasError).toBeTruthy();
  });

  test("should navigate between login and register pages", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const registerPage = new RegisterPage(page);

    await loginPage.goto();

    // Navigate to register using Page Object Model
    await loginPage.goToRegister();
    await expect(page).toHaveURL(/.*\/register/);

    // Navigate back to login using Page Object Model
    await registerPage.goToLogin();
    await expect(page).toHaveURL(/.*\/login/);
  });
});
