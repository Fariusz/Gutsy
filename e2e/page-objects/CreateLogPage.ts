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
    this.dateInput = page.getByTestId("log-date-input");
    this.ingredientsInput = page.getByTestId("ingredients-input");
    this.notesTextarea = page.getByTestId("notes-textarea");
    this.symptomSelect = page.getByTestId("symptom-select");
    this.severitySelect = page.getByTestId("severity-select");
    this.addSymptomButton = page.getByTestId("add-symptom-button");
    this.createLogButton = page.getByTestId("create-log-submit-button");
  }

  async goto() {
    await this.page.goto("/logs/new");
    await this.waitForFormToBeReady();
  }

  async waitForFormToBeReady() {
    // Wait for the ingredients input to be attached (more reliable than waiting for form visibility)
    try {
      await this.ingredientsInput.waitFor({ state: "attached", timeout: 5000 });
    } catch (error) {
      // If form isn't loading immediately, continue - it may load via React hydration
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
    await this.createLogButton.click();
  }

  async submit() {
    await this.createLogButton.click();
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
