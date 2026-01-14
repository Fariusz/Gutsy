import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Triggers Page Object Model
 *
 * Guidelines:
 * - Use locators for resilient element selection
 * - Encapsulate page-specific interactions
 */
export class TriggersPage extends BasePage {
  readonly triggersList: Locator;
  readonly triggerItems: Locator;
  readonly emptyState: Locator;
  readonly loadingState: Locator;
  readonly dateRangeFilter: Locator;

  constructor(page: Page) {
    super(page);
    this.triggersList = page.locator('[data-testid="triggers-list"], .triggers-list');
    this.triggerItems = page.locator('[data-testid="trigger-item"], .trigger-item');
    this.emptyState = page.getByText(/no triggers|insufficient data|not enough data/i);
    this.loadingState = page.locator('[data-testid="loading"], .loading');
    this.dateRangeFilter = page.locator('[data-testid="date-range-filter"]');
  }

  /**
   * Navigate to triggers page
   */
  async goto() {
    await super.goto("/triggers");
    await this.waitForLoad();
  }

  /**
   * Get number of trigger items
   */
  async getTriggerCount(): Promise<number> {
    return await this.triggerItems.count();
  }

  /**
   * Check if empty state is visible
   */
  async isEmpty(): Promise<boolean> {
    return await this.emptyState.isVisible();
  }

  /**
   * Check if loading state is visible
   */
  async isLoading(): Promise<boolean> {
    return await this.loadingState.isVisible();
  }

  /**
   * Get trigger item by index
   */
  getTriggerItem(index: number): Locator {
    return this.triggerItems.nth(index);
  }

  /**
   * Wait for triggers to load
   */
  async waitForTriggers() {
    await this.page.waitForSelector('[data-testid="trigger-item"], .trigger-item, [data-testid="empty-state"]', {
      timeout: 10000,
    });
  }
}
