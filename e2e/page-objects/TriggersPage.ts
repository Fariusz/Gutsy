import { type Page, type Locator } from "@playwright/test";

export class TriggersPage {
  readonly page: Page;
  readonly triggersContainer: Locator;
  readonly emptyState: Locator;
  readonly loadingState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.triggersContainer = page.locator('[data-test-id^="trigger-item-"]');
    this.emptyState = page.locator('text=/no triggers|no data|create logs/i');
    this.loadingState = page.locator('text=/loading/i');
  }

  async goto() {
    await this.page.goto("/triggers");
  }

  async waitForTriggers() {
    await this.page.waitForLoadState("networkidle");
  }

  async isEmpty(): Promise<boolean> {
    return await this.emptyState.isVisible().catch(() => false);
  }

  async isLoading(): Promise<boolean> {
    return await this.loadingState.isVisible().catch(() => false);
  }

  async getTriggerCount(): Promise<number> {
    return await this.triggersContainer.count();
  }
}
