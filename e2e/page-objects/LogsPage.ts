import { type Page, type Locator } from "@playwright/test";

export class LogsPage {
  readonly page: Page;
  readonly newLogButton: Locator;
  readonly logsList: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newLogButton = page.getByTestId("new-log-button-header").or(page.getByTestId("fab-new-log")).or(page.getByRole("link", { name: /new log/i }));
    this.logsList = page.locator('[data-test-id^="log-item-"]');
    this.emptyState = page.locator('text=/no logs|create your first log/i');
  }

  async goto() {
    await this.page.goto("/logs");
  }

  async goToCreateLog() {
    await this.newLogButton.click();
  }

  async isEmpty(): Promise<boolean> {
    return await this.emptyState.isVisible().catch(() => false);
  }

  async getLogCount(): Promise<number> {
    return await this.logsList.count();
  }
}
