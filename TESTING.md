# Testing Guide

This document outlines the comprehensive testing strategy implemented for the Gutsy application.

## Test Types

### Unit Tests
Located in `src/**/*.test.ts` files, covering:
- **Utility functions** (`cn`, error handlers, auth helpers)
- **Business logic** (services, repositories)
- **Validation schemas** (Zod schemas for API inputs)
- **React hooks** (custom hooks for log creation and symptom fetching)

### Integration Tests
Located in `src/test/integration/`, covering:
- **API endpoints** with mocked Supabase client
- **Full request/response cycles** without hitting real database
- **Authentication flows** and error scenarios

### End-to-End Tests  
Located in `e2e/`, covering:
- **User authentication flows** (login, register, logout)
- **Complete log creation** (from form to database to display)
- **Cross-browser compatibility**

## Running Tests

```bash
# Run all tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only  
npm run test:integration

# E2E tests
npm run test:e2e

# E2E tests with browser UI
npm run test:e2e:ui

# Test coverage report
npm run test:coverage
```

## Test Structure

### Unit Tests
- `src/lib/utils.test.ts` - Tests for `cn` utility function
- `src/lib/utils/error-handlers.test.ts` - Error handling utilities
- `src/lib/auth/auth-helpers.test.ts` - Authentication utilities
- `src/lib/services/log-service.test.ts` - Log business logic
- `src/components/hooks/*.test.tsx` - React hooks testing
- `src/lib/validation/schemas.test.ts` - Zod schema validation

### Integration Tests
- `src/test/integration/logs-api.test.ts` - Logs API endpoint testing
- `src/test/integration/symptoms-api.test.ts` - Symptoms API endpoint testing

### E2E Tests
- `e2e/auth-flow.spec.ts` - User authentication scenarios
- `e2e/create-log.spec.ts` - Complete log creation workflow
- `e2e/helpers.ts` - Reusable test utilities

## Test Configuration

### Vitest Configuration
- **Environment**: jsdom for React component testing, node for API testing
- **Setup**: `src/test/setup.ts` configures global test utilities
- **Mocks**: `src/test/mocks/` contains Supabase and other service mocks
- **Coverage**: Excludes test files, config files, and type definitions

### Playwright Configuration
- **Browsers**: Chrome, Firefox, Safari, mobile viewports
- **Base URL**: `http://localhost:4321` (Astro dev server)
- **Auto-start**: Dev server starts automatically for E2E tests
- **Retry policy**: 2 retries on CI, 0 retries locally

## Mocking Strategy

### Supabase Client Mock
Located in `src/test/mocks/supabase.ts`:
- Provides mock authentication sessions
- Mocks database operations (insert, select, etc.)
- Creates test API contexts for endpoint testing

### Service Layer Mocking
- Services are mocked at the class level in integration tests
- Allows testing API endpoints without running business logic
- Ensures tests focus on HTTP handling, authentication, and validation

## Best Practices

### Unit Testing
- Test business logic in isolation
- Mock external dependencies (Supabase, external APIs)
- Focus on edge cases and error conditions
- Validate input/output types and schemas

### Integration Testing
- Test complete API request/response cycles
- Include authentication and authorization scenarios
- Test error handling and edge cases
- Validate response formats match expected types

### E2E Testing
- Test critical user journeys end-to-end
- Include happy path and common error scenarios
- Test across different browsers and viewports
- Use page object patterns for maintainable tests

## Test Data Management

### Unit/Integration Tests
- Use mock data factories for consistent test data
- Create minimal viable test data to reduce test complexity
- Isolate tests with fresh mock instances

### E2E Tests
- Consider using test-specific database or user accounts
- Clean up test data after each test run
- Use deterministic test data for predictable results

## Continuous Integration

Tests run automatically on:
- Every pull request
- Main branch commits
- Before deployments

The CI pipeline:
1. Runs unit tests with coverage reporting
2. Runs integration tests with mocked services
3. Runs E2E tests with a real application instance
4. Fails the build if any tests fail or coverage drops below threshold

## Coverage Goals

- **Unit tests**: 80%+ coverage for business logic
- **Integration tests**: All API endpoints covered
- **E2E tests**: Critical user flows covered

Run `npm run test:coverage` to see current coverage report.

## Debugging Tests

### Unit/Integration Tests
```bash
# Run tests in watch mode
npm run test

# Run specific test file
npm run test src/lib/utils.test.ts

# Debug with browser UI
npm run test:ui
```

### E2E Tests
```bash
# Run with browser visible
npm run test:e2e:headed

# Run with Playwright UI for debugging
npm run test:e2e:ui

# Run specific test file
npx playwright test e2e/auth-flow.spec.ts
```

## Adding New Tests

### For New Features
1. **Unit tests** for business logic and utilities
2. **Integration tests** for new API endpoints
3. **E2E tests** for new user workflows

### For Bug Fixes
1. Write a failing test that reproduces the bug
2. Fix the bug
3. Ensure the test passes
4. Consider edge cases and add additional tests

## Common Testing Patterns

### Testing React Hooks
```typescript
import { renderHook, act } from "@testing-library/react";
import { useCreateLog } from "./useCreateLog";

test('should handle log creation', async () => {
  const { result } = renderHook(() => useCreateLog());
  
  await act(async () => {
    await result.current.createLog(mockData);
  });
  
  expect(result.current.isSuccess).toBe(true);
});
```

### Testing API Endpoints
```typescript
import { POST } from "../../pages/api/logs";
import { createMockAPIContext } from "../mocks/supabase";

test('should create log', async () => {
  const context = createMockAPIContext(mockSession);
  context.request.json = vi.fn().mockResolvedValue(mockData);
  
  const response = await POST(context);
  
  expect(response.status).toBe(201);
});
```

### Testing Validation Schemas
```typescript
import { CreateLogSchema } from "./schemas";

test('should validate log data', () => {
  const result = CreateLogSchema.safeParse(mockData);
  
  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data).toEqual(mockData);
  }
});
```