import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";

/**
 * Visual Comparison E2E Tests
 *
 * Guidelines:
 * - Implement visual comparison with expect(page).toHaveScreenshot()
 * - Use for UI regression testing
 * - Capture screenshots of key pages
 */
test.describe("Visual Comparison", () => {
  test("should match login page screenshot", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Take screenshot and compare
    await expect(page).toHaveScreenshot("login-page.png", {
      fullPage: true,
      maxDiffPixels: 100, // Allow small differences
    });
  });

  test("should match register page screenshot", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    // Take screenshot and compare
    await expect(page).toHaveScreenshot("register-page.png", {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test("should match login form with validation errors", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Trigger validation errors
    await loginPage.submit();

    // Wait for error messages to appear
    await page.waitForTimeout(500);

    // Take screenshot and compare
    await expect(page).toHaveScreenshot("login-page-errors.png", {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });
});
