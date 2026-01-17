import { type Page, type Locator } from "@playwright/test";

export class HomePage {
  readonly page: Page;
  readonly newLogButtonHeader: Locator;
  readonly newLogFab: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newLogButtonHeader = page.getByTestId("new-log-button-header");
    this.newLogFab = page.getByTestId("fab-new-log");
  }

  async goto() {
    await this.page.goto("/logs");
  }

  async clickNewLog() {
    // Try header button first (most reliable)
    try {
      if (await this.newLogButtonHeader.isVisible({ timeout: 3000 })) {
        await this.newLogButtonHeader.click();
        return;
      }
    } catch {
      // Header button not visible, continue to next option
    }

    // Try FAB button second
    try {
      if (await this.newLogFab.isVisible({ timeout: 3000 })) {
        await this.newLogFab.click();
        return;
      }
    } catch {
      // FAB not visible, continue
    }

    // Fallback: click any link/button with "New Log" text using first match
    const newLogButton = this.page
      .getByRole("link", { name: /new.*log|new meal/i })
      .or(this.page.getByRole("button", { name: /new.*log|new meal/i }))
      .first();

    await newLogButton.click();
  }
}
