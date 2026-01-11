import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock environment variables
vi.mock("../env.d.ts", () => ({}));

// Setup console logging for tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === "string" &&
      (args[0].includes("Warning: ReactDOM.render is deprecated") ||
        args[0].includes("Warning: An invalid form control"))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Global test utilities
global.fetch = vi.fn();
