import { test, expect } from "@playwright/test";
import { CreateLogPage } from "./pages/CreateLogPage";
import { LogsPage } from "./pages/LogsPage";
import { LoginPage } from "./pages/LoginPage";

/**
 * Create Log Flow E2E Tests
 *
 * Guidelines:
 * - Use Page Object Model for maintainable tests
 * - Use locators for resilient element selection
 * - Implement test hooks for setup and teardown
 * - Use expect assertions with specific matchers
 * - Use browser contexts for isolating test environments
 */
test.describe("Create Log Flow", () => {
  // This test assumes you have a way to authenticate users in tests
  // You may need to create test utilities for logging in

  test.beforeEach(async ({ page }) => {
    // Note: You'll need to implement test authentication
    // This could involve mocking auth, using test credentials, or creating a test login helper
    await page.goto("/");

    // TODO: Add authentication step here
    // Example: await authenticateTestUser(page);
  });

  test("should navigate to create log page", async ({ page }) => {
    const logsPage = new LogsPage(page);
    const createLogPage = new CreateLogPage(page);

    // Assuming user is authenticated, navigate to logs
    await logsPage.goto();

    // Click create new log button/link using Page Object Model
    await logsPage.goToCreateLog();
    await expect(page).toHaveURL(/.*\/logs\/new/);

    // Check form elements exist using Page Object Model
    await expect(createLogPage.dateInput).toBeVisible();
    await expect(createLogPage.ingredientsInput).toBeVisible();
    await expect(createLogPage.notesTextarea).toBeVisible();
  });

  test("should create a log with ingredients only", async ({ page }) => {
    const createLogPage = new CreateLogPage(page);
    const logsPage = new LogsPage(page);

    await createLogPage.goto();

    // Fill in basic log data using Page Object Model
    await createLogPage.createLog({
      date: "2023-12-26",
      ingredients: "apple, banana, orange",
      notes: "Test meal from E2E test",
    });

    // Should redirect to logs list and show success
    await expect(page).toHaveURL(/.*\/logs$/);
    await expect(page.getByText("apple, banana, orange")).toBeVisible();
  });

  test("should create a log with ingredients and symptoms", async ({ page }) => {
    await page.goto("/logs/new");

    // Fill in log data
    await page.fill('input[name="log_date"]', "2023-12-26");
    await page.fill('input[name="ingredients"]', "tomato, basil");
    await page.fill('textarea[name="notes"]', "Italian meal test");

    // Add symptoms (this depends on your UI implementation)
    await page.getByText("Add Symptom").click();
    await page.selectOption('select[name="symptom_id"]', "1"); // Assuming headache has ID 1
    await page.selectOption('select[name="severity"]', "3");

    // Submit the form
    await page.getByText("Save Log").click();

    // Verify success
    await expect(page).toHaveURL(/.*\/logs$/);
    await expect(page.getByText("tomato, basil")).toBeVisible();
    await expect(page.getByText("Headache")).toBeVisible();
  });

  test("should show validation errors for empty form", async ({ page }) => {
    const createLogPage = new CreateLogPage(page);
    await createLogPage.goto();

    // Try to submit empty form using Page Object Model
    await createLogPage.submit();

    // Should show validation errors
    const hasError = await createLogPage.hasErrorMessage();
    expect(hasError).toBeTruthy();
  });

  test("should show validation error for invalid date", async ({ page }) => {
    await page.goto("/logs/new");

    // Fill with invalid date
    await page.fill('input[name="log_date"]', "invalid-date");
    await page.fill('input[name="ingredients"]', "apple");
    await page.getByText("Save Log").click();

    // Should show date validation error
    await expect(page.getByText("Please enter a valid date")).toBeVisible();
  });

  test("should cancel log creation", async ({ page }) => {
    const createLogPage = new CreateLogPage(page);
    await createLogPage.goto();

    // Fill in some data using Page Object Model
    await createLogPage.fillLogForm({
      ingredients: "test ingredient",
    });

    // Click cancel using Page Object Model
    await createLogPage.cancel();

    // Should navigate back to logs list
    await expect(page).toHaveURL(/.*\/logs$/);
  });

  test("should view created log details", async ({ page }) => {
    // First create a log
    await page.goto("/logs/new");
    await page.fill('input[name="log_date"]', "2023-12-26");
    await page.fill('input[name="ingredients"]', "test ingredient");
    await page.fill('textarea[name="notes"]', "Test log for viewing");
    await page.getByText("Save Log").click();

    // Now click on the created log to view details
    await page.getByText("test ingredient").click();

    // Should show log details (adjust based on your implementation)
    await expect(page.getByText("Test log for viewing")).toBeVisible();
    await expect(page.getByText("2023-12-26")).toBeVisible();
  });
});
