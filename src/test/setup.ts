import "@testing-library/jest-dom";
import { vi, afterEach, beforeAll, afterAll } from "vitest";
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
  console.error = (...args: unknown[]) => {
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
const mockIntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: "",
  thresholds: [],
}));

global.IntersectionObserver = mockIntersectionObserver;

// Mock ResizeObserver for components that use it
const mockResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

global.ResizeObserver = mockResizeObserver;

// Extend Vitest's expect with custom matchers if needed
// Example: expect.extend({ ... })
