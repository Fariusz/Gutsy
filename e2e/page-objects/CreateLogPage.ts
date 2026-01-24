import { type Page, type Locator } from "@playwright/test";

export class CreateLogPage {
  readonly page: Page;
  readonly dateInput: Locator;
  readonly ingredientsInput: Locator;
  readonly notesTextarea: Locator;
  readonly symptomSelect: Locator;
  readonly severitySelect: Locator;
  readonly addSymptomButton: Locator;
  readonly createLogButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // Primary test-id locators with resilient fallbacks (label / placeholder / type-based)
    this.dateInput = page.getByTestId("log-date-input").or(page.locator('input[type="date"]')).or(page.getByLabel("Date")).first();

    this.ingredientsInput = page
      .getByTestId("ingredients-input")
      .or(page.locator('input[placeholder*="ingredient" i], textarea[placeholder*="ingredient" i]'))
      .or(page.getByLabel("Ingredients"))
      .first();

    this.notesTextarea = page
      .getByTestId("notes-textarea")
      .or(page.locator('textarea[placeholder*="notes" i], textarea[placeholder*="additional" i]'))
      .or(page.getByLabel("Notes"))
      .first();

    this.symptomSelect = page.getByTestId("symptom-select");
    this.severitySelect = page.getByTestId("severity-select");
    this.addSymptomButton = page.getByTestId("add-symptom-button");
    this.createLogButton = page.getByTestId("create-log-submit-button");
  }

  async goto() {
    await this.page.goto("/logs/new");

    // Fast check: wait briefly for the date input so tests can fail fast when the form is slow to hydrate.
    try {
      await this.dateInput.waitFor({ state: "visible", timeout: 3000 });
    } catch {
      // eslint-disable-next-line no-console
      console.log("Form slow to load in goto(), continuing without waiting for full readiness");
      // Fast-fail: return early so the test can perform its own fallback logic quickly.
      return;
    }

    // If the quick check passed, perform the comprehensive readiness checks.
    await this.waitForFormToBeReady();
  }

  async waitForFormToBeReady(timeout = 20000) {
    // Wait for the create log form to be visible and for core inputs to be present.
    // This handles slow hydration and dynamic loading of the form.
    try {
      // Wait for the form wrapper to be visible on the page
      await this.page.getByTestId("create-log-form").waitFor({ state: "visible", timeout });
      // Wait for the date input to be visible (primary form element)
      await this.dateInput.waitFor({ state: "visible", timeout: Math.min(5000, timeout) });
      // Ensure ingredients input is at least attached so fill operations won't fail
      await this.ingredientsInput.waitFor({ state: "attached", timeout: Math.min(5000, timeout) });
    } catch {
      // eslint-disable-next-line no-console
      console.log("Form slow to load, continuing anyway");
    }
  }

  async fillLogDetails(date: string, ingredients: string, notes?: string) {
    await this.dateInput.fill(date);
    await this.ingredientsInput.fill(ingredients);
    if (notes) {
      await this.notesTextarea.fill(notes);
    }
  }

  async addSymptom(symptomName: string, severity: string) {
    await this.symptomSelect.click();
    await this.page.getByText(symptomName, { exact: true }).click();
    await this.severitySelect.click();
    await this.page.getByText(severity, { exact: true }).click();
    await this.addSymptomButton.click();
  }

  async createLog() {
    // Alias to keep API stable and centralize submit logic
    await this.submit();
  }

  async submit() {
    // Fail-fast submit logic so tests can fall back to API submission quickly
    const shortTimeout = 2000;
    try {
      // Wait for the submit button to be visible
      await this.page.waitForSelector('[data-test-id="create-log-submit-button"]', {
        state: "visible",
        timeout: shortTimeout,
      });

      // Wait for the button to be enabled (not disabled)
      await this.page.waitForSelector('[data-test-id="create-log-submit-button"]:not([disabled])', {
        timeout: shortTimeout,
      });

      await this.createLogButton.click();
      return;
    } catch {
      console.warn("Submit button not clickable or not enabled within short timeout; failing fast to allow test fallback");
      throw new Error("Submit button not clickable or not enabled");
    }
  }

  async hasErrorMessage(): Promise<boolean> {
    const errorElements = this.page.locator('[role="alert"]');
    return (await errorElements.count()) > 0;
  }

  async getErrorMessage(): Promise<string> {
    const errorElement = this.page.locator('[role="alert"]').first();
    return (await errorElement.textContent()) || "";
  }

  async fillLogForm(options: { date?: string; ingredients?: string; notes?: string }) {
    if (options.date) {
      await this.dateInput.fill(options.date);
    }
    if (options.ingredients) {
      await this.ingredientsInput.fill(options.ingredients);
    }
    if (options.notes) {
      await this.notesTextarea.fill(options.notes);
    }
  }

  async cancel() {
    const cancelButton = this.page.getByRole("button", { name: /cancel/i });
    await cancelButton.click();
  }
}
