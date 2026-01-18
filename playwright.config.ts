import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load test environment variables
dotenv.config({ path: resolve(__dirname, ".env.test") });

/**
 * Playwright configuration for E2E tests
 *
 * Guidelines:
 * - Initialize configuration only with Chromium/Desktop Chrome browser
 * - Use browser contexts for isolating test environments
 * - Implement the Page Object Model for maintainable tests
 * - Use locators for resilient element selection
 * - Leverage API testing for backend validation
 * - Implement visual comparison with expect(page).toHaveScreenshot()
 * - Use the codegen tool for test recording
 * - Leverage trace viewer for debugging test failures
 * - Implement test hooks for setup and teardown
 * - Use expect assertions with specific matchers
 * - Leverage parallel execution for faster test runs
 *
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./e2e",

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? [["html"], ["list"], ["github"]] : [["html"], ["list"]],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: "http://localhost:3000",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",

    /* Screenshot on failure with platform-agnostic settings */
    screenshot: {
      mode: "only-on-failure",
      fullPage: true,
    },

    /* Video on failure */
    video: "retain-on-failure",

    /* Disable animations for consistent visual testing */
    ignoreHTTPSErrors: true,
  },

  /* Use platform-agnostic snapshot names for consistent visual testing across CI/CD */
  snapshotPathTemplate: "{testDir}/{testFileDir}/{testFileName}-snapshots/{arg}{ext}",

  /* Configure projects - Only Chromium/Desktop Chrome as per guidelines */
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 789 }, // Match existing snapshot dimensions
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "npm run dev:e2e",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
