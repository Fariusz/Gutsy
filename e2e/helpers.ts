import { Page } from '@playwright/test';

/**
 * Test utilities for E2E tests
 */

/**
 * Authenticate a test user (mock implementation)
 * In a real implementation, you would:
 * 1. Use test-specific auth endpoints
 * 2. Mock authentication state
 * 3. Use browser storage to set auth tokens
 */
export async function authenticateTestUser(page: Page, email = 'test@example.com') {
  // This is a placeholder implementation
  // You'll need to implement this based on your auth system
  
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', 'testpassword123');
  await page.getByText('Sign in').click();
  
  // Wait for successful authentication (adjust based on your app)
  await page.waitForURL('/logs', { timeout: 5000 });
}

/**
 * Create a test log via the UI
 */
export async function createTestLog(page: Page, options: {
  date?: string;
  ingredients?: string;
  notes?: string;
  symptoms?: Array<{ name: string; severity: number }>;
} = {}) {
  const {
    date = new Date().toISOString().split('T')[0],
    ingredients = 'test ingredient',
    notes = 'Test log notes',
    symptoms = []
  } = options;

  await page.goto('/logs/new');
  
  await page.fill('input[name="log_date"]', date);
  await page.fill('input[name="ingredients"]', ingredients);
  
  if (notes) {
    await page.fill('textarea[name="notes"]', notes);
  }

  // Add symptoms if specified
  for (const symptom of symptoms) {
    await page.getByText('Add Symptom').click();
    await page.selectOption('select[name="symptom_id"]', { label: symptom.name });
    await page.selectOption('select[name="severity"]', symptom.severity.toString());
  }

  await page.getByText('Save Log').click();
  await page.waitForURL('/logs');
}

/**
 * Wait for an element to be visible with timeout
 */
export async function waitForElement(page: Page, selector: string, timeout = 5000) {
  await page.waitForSelector(selector, { state: 'visible', timeout });
}

/**
 * Clear local storage and session storage
 */
export async function clearAuthState(page: Page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Check if user is authenticated by looking for auth indicators
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  // Check for presence of authenticated user elements
  // Adjust selectors based on your app's structure
  try {
    await page.waitForSelector('[data-testid="user-menu"]', { timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}