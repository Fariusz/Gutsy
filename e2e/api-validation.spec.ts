import { test, expect } from "@playwright/test";

/**
 * API Validation E2E Tests
 *
 * Guidelines:
 * - Leverage API testing for backend validation
 * - Test API endpoints directly without UI
 * - Verify response structure and status codes
 */
test.describe("API Validation", () => {
  const baseURL = "http://localhost:3000";

  test("should validate auth status endpoint", async ({ request }) => {
    const response = await request.get(`${baseURL}/api/auth/status`);

    // Should return valid response (200 or 401 depending on auth state)
    expect([200, 401]).toContain(response.status());

    const body = await response.json();
    expect(body).toHaveProperty("authenticated");
    expect(typeof body.authenticated).toBe("boolean");
  });

  test("should validate logs API endpoint structure", async ({ request }) => {
    const response = await request.get(`${baseURL}/api/logs`);

    // Should return valid response structure
    expect([200, 401]).toContain(response.status());

    if (response.status() === 200) {
      const body = await response.json();
      expect(Array.isArray(body) || Object.prototype.hasOwnProperty.call(body, "logs")).toBeTruthy();
    }
  });

  test("should validate triggers API endpoint structure", async ({ request }) => {
    const response = await request.get(`${baseURL}/api/triggers`);

    // Should return valid response structure
    expect([200, 401]).toContain(response.status());

    if (response.status() === 200) {
      const body = await response.json();
      expect(Array.isArray(body) || Object.prototype.hasOwnProperty.call(body, "triggers")).toBeTruthy();
    }
  });

  test("should reject invalid login credentials", async ({ request }) => {
    const response = await request.post(`${baseURL}/api/auth/login`, {
      data: {
        email: "invalid@example.com",
        password: "wrongpassword",
      },
    });

    // Should return error status
    expect([400, 401]).toContain(response.status());

    const body = await response.json();
    expect(body).toHaveProperty("error");
  });
});
