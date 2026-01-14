import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Login Page Object Model
 *
 * Guidelines:
 * - Use locators for resilient element selection
 * - Encapsulate page-specific interactions
 */
export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly signUpLink: Locator;
  readonly forgotPasswordLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.signInButton = page.getByRole("button", { name: /sign in/i });
    this.signUpLink = page.getByText(/sign up/i);
    this.forgotPasswordLink = page.getByText(/forgot password/i);
    this.errorMessage = page.locator('[role="alert"], .error-message');
  }

  /**
   * Navigate to login page
   */
  async goto() {
    await super.goto("/login");
    await this.waitForLoad();
  }

  /**
   * Fill login form
   */
  async fillLoginForm(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  /**
   * Submit login form
   */
  async submit() {
    await this.signInButton.click();
  }

  /**
   * Perform complete login flow
   */
  async login(email: string, password: string) {
    await this.fillLoginForm(email, password);
    await this.submit();
  }

  /**
   * Navigate to register page
   */
  async goToRegister() {
    await this.signUpLink.click();
  }

  /**
   * Navigate to forgot password page
   */
  async goToForgotPassword() {
    await this.forgotPasswordLink.click();
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
