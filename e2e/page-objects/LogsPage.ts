import { type Page, type Locator } from "@playwright/test";

export class LogsPage {
  readonly page: Page;
  readonly newLogButtonHeader: Locator;
  readonly newLogFab: Locator;
  readonly newLogFallback: Locator;
  readonly logsList: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newLogButtonHeader = page.getByTestId("new-log-button-header");
    this.newLogFab = page.getByTestId("fab-new-log");
    // Fallback locator targeting any link that navigates to the create log route.
    // Use `.first()` to avoid strict-mode conflicts when multiple matching links exist.
    this.newLogFallback = page.locator('a[href="/logs/new"]').first();
    this.logsList = page.locator('[data-test-id^="log-item-"]');
    this.emptyState = page.locator("text=/no logs|create your first log/i");
  }

  async goto() {
    await this.page.goto("/logs");
  }

  async goToCreateLog() {
    // Prefer header button when visible
    try {
      if (await this.newLogButtonHeader.isVisible({ timeout: 2000 })) {
        // Ensure we wait for navigation to the create page to avoid race conditions
        await Promise.all([this.page.waitForURL(/.*\/logs\/new/), this.newLogButtonHeader.click()]);
        return;
      }
    } catch {
      // ignore and try next option
    }

    // Try the FAB button next
    try {
      if (await this.newLogFab.isVisible({ timeout: 2000 })) {
        await Promise.all([this.page.waitForURL(/.*\/logs\/new/), this.newLogFab.click()]);
        return;
      }
    } catch {
      // ignore and use fallback
    }

    // Last resort: click the first link we know goes to the create log route
    await Promise.all([this.page.waitForURL(/.*\/logs\/new/), this.newLogFallback.click()]);
  }

  async isEmpty(): Promise<boolean> {
    return await this.emptyState.isVisible().catch(() => false);
  }

  async getLogCount(): Promise<number> {
    return await this.logsList.count();
  }
}
