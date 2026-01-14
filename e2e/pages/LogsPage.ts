import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Logs Page Object Model
 *
 * Guidelines:
 * - Use locators for resilient element selection
 * - Encapsulate page-specific interactions
 */
export class LogsPage extends BasePage {
  readonly createLogButton: Locator;
  readonly logsList: Locator;
  readonly logItems: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    super(page);
    this.createLogButton = page.getByRole("button", { name: /create|add|new/i });
    this.logsList = page.locator('[data-testid="logs-list"], .logs-list');
    this.logItems = page.locator('[data-testid="log-item"], .log-item');
    this.emptyState = page.getByText(/no logs|empty|get started/i);
  }

  /**
   * Navigate to logs page
   */
  async goto() {
    await super.goto("/logs");
    await this.waitForLoad();
  }

  /**
   * Navigate to create log page
   */
  async goToCreateLog() {
    await this.createLogButton.click();
  }

  /**
   * Get number of log items
   */
  async getLogCount(): Promise<number> {
    return await this.logItems.count();
  }

  /**
   * Check if empty state is visible
   */
  async isEmpty(): Promise<boolean> {
    return await this.emptyState.isVisible();
  }

  /**
   * Get log item by index
   */
  getLogItem(index: number): Locator {
    return this.logItems.nth(index);
  }
}
