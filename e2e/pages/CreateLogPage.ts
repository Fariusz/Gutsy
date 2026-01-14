import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Create Log Page Object Model
 *
 * Guidelines:
 * - Use locators for resilient element selection
 * - Encapsulate page-specific interactions
 */
export class CreateLogPage extends BasePage {
  readonly dateInput: Locator;
  readonly ingredientsInput: Locator;
  readonly notesTextarea: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly addSymptomButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.dateInput = page.locator('input[name="log_date"], input[type="date"]');
    this.ingredientsInput = page.locator('input[name="ingredients"], textarea[name="ingredients"]');
    this.notesTextarea = page.locator('textarea[name="notes"]');
    this.saveButton = page.getByRole("button", { name: /save|submit|create/i });
    this.cancelButton = page.getByRole("button", { name: /cancel/i });
    this.addSymptomButton = page.getByText(/add symptom/i);
    this.errorMessage = page.locator('[role="alert"], .error-message');
  }

  /**
   * Navigate to create log page
   */
  async goto() {
    await super.goto("/logs/new");
    await this.waitForLoad();
  }

  /**
   * Fill log form
   */
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

  /**
   * Submit log form
   */
  async submit() {
    await this.saveButton.click();
  }

  /**
   * Cancel log creation
   */
  async cancel() {
    await this.cancelButton.click();
  }

  /**
   * Perform complete log creation flow
   */
  async createLog(options: { date?: string; ingredients?: string; notes?: string }) {
    await this.fillLogForm(options);
    await this.submit();
  }

  /**
   * Check if error message is visible
   */
  async hasErrorMessage(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    return (await this.errorMessage.textContent()) || "";
  }
}
