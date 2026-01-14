import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Register Page Object Model
 *
 * Guidelines:
 * - Use locators for resilient element selection
 * - Encapsulate page-specific interactions
 */
export class RegisterPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly createAccountButton: Locator;
  readonly signInLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]').first();
    this.confirmPasswordInput = page.locator('input[type="password"]').last();
    this.createAccountButton = page.getByRole("button", { name: /create account/i });
    this.signInLink = page.getByText(/sign in/i);
    this.errorMessage = page.locator('[role="alert"], .error-message');
  }

  /**
   * Navigate to register page
   */
  async goto() {
    await super.goto("/register");
    await this.waitForLoad();
  }

  /**
   * Fill registration form
   */
  async fillRegistrationForm(email: string, password: string, confirmPassword?: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    if (confirmPassword) {
      await this.confirmPasswordInput.fill(confirmPassword);
    } else {
      await this.confirmPasswordInput.fill(password);
    }
  }

  /**
   * Submit registration form
   */
  async submit() {
    await this.createAccountButton.click();
  }

  /**
   * Perform complete registration flow
   */
  async register(email: string, password: string, confirmPassword?: string) {
    await this.fillRegistrationForm(email, password, confirmPassword);
    await this.submit();
  }

  /**
   * Navigate to login page
   */
  async goToLogin() {
    await this.signInLink.click();
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
