# Testing Guide - Gutsy

This document describes the testing setup and how to run tests for the Gutsy application.

## Overview

The project uses two main testing frameworks:

- **Vitest** - For unit and integration tests
- **Playwright** - For end-to-end (E2E) tests

## Test Structure

```
.
├── e2e/                          # E2E tests (Playwright)
│   ├── pages/                    # Page Object Model classes
│   │   ├── BasePage.ts
│   │   ├── LoginPage.ts
│   │   ├── RegisterPage.ts
│   │   ├── LogsPage.ts
│   │   ├── CreateLogPage.ts
│   │   └── TriggersPage.ts
│   ├── auth-flow.spec.ts
│   ├── create-log.spec.ts
│   ├── triggers-flow.spec.ts
│   ├── api-validation.spec.ts
│   ├── visual-comparison.spec.ts
│   └── helpers.ts
├── src/
│   └── test/                      # Unit and integration tests (Vitest)
│       ├── setup.ts              # Global test setup
│       ├── mocks/                # Mock implementations
│       │   └── supabase.ts
│       ├── unit/                 # Unit tests
│       └── integration/           # Integration tests
└── src/**/*.test.ts              # Component and utility tests
```

## Running Tests

### Unit and Integration Tests (Vitest)

```bash
# Run all tests in watch mode (recommended during development)
npm test

# Run tests once
npm run test:unit

# Run tests with UI mode (visual test explorer)
npm run test:ui

# Run tests with coverage report
npm run test:coverage

# Run only integration tests
npm run test:integration
```

### End-to-End Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI mode (interactive)
npm run test:e2e:ui

# Run E2E tests in headed mode (see browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test e2e/auth-flow.spec.ts
```

## Test Configuration

### Vitest Configuration

The Vitest configuration (`vitest.config.ts`) includes:

- **Environment**: jsdom for DOM testing
- **Coverage**: v8 provider with thresholds (80% lines, functions, statements; 75% branches)
- **Setup**: Global test setup file at `src/test/setup.ts`
- **Aliases**: Path aliases for `@/`, `@/db`, `@/lib`, `@/components`

### Playwright Configuration

The Playwright configuration (`playwright.config.ts`) includes:

- **Browser**: Chromium/Desktop Chrome only (as per guidelines)
- **Base URL**: http://localhost:4321
- **Web Server**: Automatically starts dev server before tests
- **Trace**: Enabled on first retry for debugging
- **Screenshots**: Captured on failure
- **Videos**: Retained on failure

## Best Practices

### Vitest Guidelines

1. **Use `vi` object for test doubles**
   - `vi.fn()` for function mocks
   - `vi.spyOn()` to monitor existing functions
   - `vi.stubGlobal()` for global mocks

2. **Master `vi.mock()` factory patterns**
   - Place mock factories at the top level
   - Return typed mock implementations
   - Use `mockImplementation()` or `mockReturnValue()` for dynamic control

3. **Use inline snapshots**
   - Replace complex equality checks with `expect(value).toMatchInlineSnapshot()`
   - Makes changes more visible in code reviews

4. **Structure tests for maintainability**
   - Group related tests with `describe` blocks
   - Use explicit assertion messages
   - Follow Arrange-Act-Assert pattern

5. **Leverage TypeScript type checking**
   - Enable strict typing in tests
   - Use `expectTypeOf()` for type-level assertions

### Playwright Guidelines

1. **Use Page Object Model (POM)**
   - Encapsulate page interactions in classes
   - Located in `e2e/pages/` directory
   - Extend `BasePage` for common functionality

2. **Use locators for element selection**
   - Prefer `page.getByRole()`, `page.getByText()`, `page.locator()`
   - Avoid brittle selectors like `page.$('div.class')`

3. **Leverage API testing**
   - Test backend endpoints directly with `request` fixture
   - Validate response structure and status codes

4. **Implement visual comparison**
   - Use `expect(page).toHaveScreenshot()` for UI regression testing
   - See `e2e/visual-comparison.spec.ts` for examples

5. **Use test hooks**
   - `test.beforeEach()` for setup
   - `test.afterEach()` for cleanup
   - `test.describe()` for grouping

6. **Use browser contexts**
   - Isolate test environments
   - Each test gets its own context automatically

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect, vi } from "vitest";

describe("MyFunction", () => {
  it("should return expected value", () => {
    // Arrange
    const input = "test";

    // Act
    const result = myFunction(input);

    // Assert
    expect(result).toBe("expected");
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";

test.describe("Authentication", () => {
  test("should login successfully", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("user@example.com", "password");
    await expect(page).toHaveURL(/.*\/logs/);
  });
});
```

## Coverage Goals

The project aims for:

- **80%** line coverage
- **80%** function coverage
- **80%** statement coverage
- **75%** branch coverage

Focus on meaningful tests rather than arbitrary coverage percentages.

## CI/CD Integration

Tests are automatically run in GitHub Actions:

- Unit and integration tests run on every push
- E2E tests run on pull requests
- Coverage reports are generated and uploaded

## Debugging Tests

### Vitest

```bash
# Run in watch mode for instant feedback
npm test

# Use UI mode for complex test suites
npm run test:ui

# Run specific test
npm test -- my-test-file.test.ts
```

### Playwright

```bash
# Use trace viewer for debugging failures
npx playwright show-trace trace.zip

# Run in headed mode to see browser
npm run test:e2e:headed

# Use UI mode for interactive debugging
npm run test:e2e:ui

# Run with debugger
PWDEBUG=1 npx playwright test
```

## Test Data

- Test data should be isolated per test
- Use test fixtures or factories for creating test data
- Clean up test data in `afterEach` hooks
- For E2E tests, consider using test-specific authentication helpers

## Troubleshooting

### Tests fail with "Cannot find module"

- Ensure all dependencies are installed: `npm install`
- Check that path aliases are correctly configured in `vitest.config.ts`

### Playwright tests timeout

- Ensure dev server is running or configured in `playwright.config.ts`
- Check that base URL is correct
- Increase timeout in test configuration if needed

### Coverage not generating

- Ensure `@vitest/coverage-v8` is installed
- Check `vitest.config.ts` coverage configuration

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Documentation](https://testing-library.com/)
