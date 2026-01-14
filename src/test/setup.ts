import "@testing-library/jest-dom";
import { vi, expect, afterEach, beforeAll, afterAll } from "vitest";
import { cleanup } from "@testing-library/react";

/**
 * Global test setup file for Vitest
 *
 * This file contains:
 * - Global mocks and test doubles using `vi` object
 * - Custom matchers and utilities
 * - Environment setup and teardown
 * - Console error filtering
 */

// Mock environment variables
vi.mock("../env.d.ts", () => ({}));

// Setup console logging for tests - filter out known React warnings
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === "string" &&
      (args[0].includes("Warning: ReactDOM.render is deprecated") ||
        args[0].includes("Warning: An invalid form control") ||
        args[0].includes("Warning: ReactDOM.hydrate is deprecated"))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Cleanup after each test (for React Testing Library)
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Global test utilities - use vi.fn() for function mocks
global.fetch = vi.fn();

// Mock window.matchMedia for components that use media queries
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver for components that use it
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver for components that use it
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Extend Vitest's expect with custom matchers if needed
// Example: expect.extend({ ... })
