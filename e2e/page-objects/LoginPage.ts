import { type Page, type Locator } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByRole("textbox", { name: "Email Address" });
    this.passwordInput = page.getByRole("textbox", { name: "Password" });
    this.signInButton = page.getByRole("button", { name: "Sign in" });
  }

  async goto() {
    await this.page.goto("/login");
  }

  async waitForLoad() {
    await this.emailInput.waitFor({ state: "visible" });
    await this.passwordInput.waitFor({ state: "visible" });
    await this.signInButton.waitFor({ state: "visible" });
  }

  async login(email: string, password_val: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password_val);
    await this.signInButton.click();
  }

  async submit() {
    await this.signInButton.click();
  }

  async hasErrorMessage(): Promise<boolean> {
    const errorElements = this.page.locator('[role="alert"]');
    return (await errorElements.count()) > 0;
  }

  async getErrorMessage(): Promise<string> {
    const errorElement = this.page.locator('[role="alert"]').first();
    return (await errorElement.textContent()) || "";
  }

  async goToRegister() {
    const registerLink = this.page.getByRole("link", { name: /sign up|register/i });
    await registerLink.click();
  }

  async fillLoginForm(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }
}
