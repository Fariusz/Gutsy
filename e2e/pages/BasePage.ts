import { Page, Locator } from "@playwright/test";

/**
 * Base Page Object Model class
 *
 * Guidelines:
 * - Use locators for resilient element selection
 * - Implement reusable page methods
 * - Use browser contexts for isolating test environments
 */
export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a specific path
   */
  async goto(path: string) {
    await this.page.goto(path);
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Get current URL
   */
  getUrl(): string {
    return this.page.url();
  }

  /**
   * Wait for page to be loaded
   */
  async waitForLoad() {
    await this.page.waitForLoadState("networkidle");
  }
}
