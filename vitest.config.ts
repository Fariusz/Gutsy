import { defineConfig } from "vitest/config";
import { resolve } from "path";
import react from "@vitejs/plugin-react";

/**
 * Vitest configuration for unit and integration tests
 *
 * Guidelines:
 * - Leverage the `vi` object for test doubles
 * - Master `vi.mock()` factory patterns
 * - Create setup files for reusable configuration
 * - Use inline snapshots for readable assertions
 * - Monitor coverage with purpose
 * - Make watch mode part of your workflow
 * - Explore UI mode for complex test suites
 * - Handle optional dependencies with smart mocking
 * - Configure jsdom for DOM testing
 * - Structure tests for maintainability
 * - Leverage TypeScript type checking in tests
 */
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{js,ts,tsx}"],
    exclude: ["node_modules", "dist", ".astro", "e2e/**"],

    /* Coverage configuration - monitor with purpose */
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json", "lcov"],
      exclude: ["node_modules/", "src/test/", "**/*.d.ts", "**/*.config.*", "**/coverage/**", "**/types.ts", "**/database.types.ts"],
      /* Coverage thresholds - focus on meaningful tests rather than arbitrary percentages */
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },

    /* Test timeout */
    testTimeout: 10000,

    /* Hook timeout */
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@/db": resolve(__dirname, "./src/db"),
      "@/lib": resolve(__dirname, "./src/lib"),
      "@/components": resolve(__dirname, "./src/components"),
    },
  },
});
