import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start each test from the homepage
    await page.goto('/');
  });

  test('should navigate to login page from home', async ({ page }) => {
    // Check if we're redirected to login or can navigate to login
    await page.getByText('Log in').click();
    await expect(page).toHaveURL(/.*\/login/);
    
    // Check login form elements exist
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByText('Sign in')).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/register');
    
    // Check register form elements exist
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByText('Create account')).toBeVisible();
  });

  test('should show validation errors for invalid login', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit with empty fields
    await page.getByText('Sign in').click();
    
    // Should show validation messages (these depend on your form implementation)
    // Adjust selectors based on your actual error display
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.getByText('Sign in').click();
    
    // Should show error message (adjust based on your implementation)
    await expect(page.getByText('Invalid credentials')).toBeVisible();
  });

  test('should navigate between login and register pages', async ({ page }) => {
    await page.goto('/login');
    
    // Navigate to register
    await page.getByText('Sign up').click();
    await expect(page).toHaveURL(/.*\/register/);
    
    // Navigate back to login
    await page.getByText('Sign in').click();
    await expect(page).toHaveURL(/.*\/login/);
  });
});