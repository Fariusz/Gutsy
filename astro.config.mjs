// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://gutsy.pages.dev",
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  adapter: cloudflare(),
  vite: {
    plugins: [
      tailwindcss(),
      // Custom plugin to exclude test files from Vite processing
      {
        name: "exclude-test-files",
        enforce: "pre",
        resolveId(id) {
          // Exclude test files from being processed - return virtual module
          const testFilePattern = /\.(test|spec)\.(ts|tsx|js|jsx)$/;
          if (testFilePattern.test(id)) {
            return "\0virtual:test-file";
          }
          return null;
        },
        load(id) {
          // Return empty module for test files to prevent processing errors
          if (id === "\0virtual:test-file") {
            return "export {}";
          }
          return null;
        },
      },
    ],
    // Exclude test dependencies from optimization
    optimizeDeps: {
      exclude: ["vitest", "@testing-library/react", "@testing-library/jest-dom", "@testing-library/user-event"],
    },
    // Configure server to ignore test files from watching
    server: {
      watch: {
        ignored: ["**/*.test.{ts,tsx,js,jsx}", "**/*.spec.{ts,tsx,js,jsx}", "**/test/**", "**/e2e/**", "**/__tests__/**"],
      },
    },
    // Exclude test files from SSR processing
    ssr: {
      noExternal: [],
      external: ["vitest", "@testing-library/react", "@testing-library/jest-dom", "@testing-library/user-event"],
    },
  },
});
