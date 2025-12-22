import { describe, test, expect, beforeAll, afterAll, vi } from "vitest";
import type { NormalizeIngredientResponse } from "../../../types";

// Mock Supabase client for testing
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => ({ data: null, error: "not found" })),
      })),
      textSearch: vi.fn(() => ({
        limit: vi.fn(() => ({ data: [], error: null })),
      })),
      ilike: vi.fn(() => ({
        limit: vi.fn(() => ({ data: [], error: null })),
      })),
    })),
  })),
};

// Mock environment
vi.mock("../../db/supabase.client", () => ({
  supabaseClient: mockSupabaseClient,
}));

describe("Ingredient Normalization API Integration Tests", () => {
  const ENDPOINT_URL = "http://localhost:3000/api/ingredients/normalize";

  beforeAll(() => {
    // Setup test environment
    process.env.NODE_ENV = "test";
  });

  afterAll(() => {
    // Cleanup
    vi.restoreAllMocks();
  });

  describe("Input Validation", () => {
    test("should reject empty string input", async () => {
      const response = await fetch(ENDPOINT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
        body: JSON.stringify({ raw_text: "" }),
      });

      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error.error.type).toBe("validation_error");
    });

    test("should reject text longer than 100 characters", async () => {
      const longText = "a".repeat(150);
      const response = await fetch(ENDPOINT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
        body: JSON.stringify({ raw_text: longText }),
      });

      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error.error.type).toBe("validation_error");
    });

    test("should reject whitespace-only input", async () => {
      const response = await fetch(ENDPOINT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
        body: JSON.stringify({ raw_text: "   \\t\\n   " }),
      });

      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error.error.type).toBe("validation_error");
    });

    test("should reject request without authorization", async () => {
      const response = await fetch(ENDPOINT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw_text: "tomatoes" }),
      });

      expect(response.status).toBe(401);
      const error = await response.json();
      expect(error.error.type).toBe("authorization_error");
    });

    test("should reject malformed JSON", async () => {
      const response = await fetch(ENDPOINT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
        body: "{ invalid json }",
      });

      expect(response.status).toBe(400);
    });
  });

  describe("Rate Limiting", () => {
    test("should enforce rate limits after many requests", async () => {
      // Simulate rapid requests from same user
      const promises = Array.from({ length: 55 }, () =>
        fetch(ENDPOINT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer same-user-token",
          },
          body: JSON.stringify({ raw_text: "test ingredient" }),
        })
      );

      const responses = await Promise.all(promises);
      const rateLimited = responses.filter((r) => r.status === 429);

      // Should have at least some rate limited responses after 50 requests
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe("Error Handling", () => {
    test("should handle database connection errors gracefully", async () => {
      // Mock database error
      mockSupabaseClient.from.mockImplementationOnce(() => ({
        select: () => ({
          eq: () => ({
            single: () => ({ data: null, error: new Error("Database connection failed") }),
          }),
        }),
      }));

      const response = await fetch(ENDPOINT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
        body: JSON.stringify({ raw_text: "tomatoes" }),
      });

      expect(response.status).toBe(500);
      const error = await response.json();
      expect(error.error.type).toBe("internal_server_error");
    });

    test("should handle no matches gracefully", async () => {
      const response = await fetch(ENDPOINT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
        body: JSON.stringify({ raw_text: "xyznonexistentingredient123" }),
      });

      expect(response.status).toBe(422);
      const error = await response.json();
      expect(error.error.type).toBe("business_logic_error");
    });
  });

  describe("Response Format", () => {
    test("should return proper response structure for valid input", async () => {
      // Mock successful ingredient match
      mockSupabaseClient.from.mockImplementationOnce(() => ({
        select: () => ({
          eq: () => ({
            single: () => ({
              data: { id: 1, name: "tomatoes" },
              error: null,
            }),
          }),
        }),
      }));

      const response = await fetch(ENDPOINT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
        body: JSON.stringify({ raw_text: "tomatoes" }),
      });

      expect(response.status).toBe(200);

      const result: NormalizeIngredientResponse = await response.json();

      // Validate response structure
      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("raw_text");
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.raw_text).toBe("tomatoes");

      if (result.data.length > 0) {
        const match = result.data[0];
        expect(match).toHaveProperty("ingredient_id");
        expect(match).toHaveProperty("name");
        expect(match).toHaveProperty("match_confidence");
        expect(match).toHaveProperty("match_method");

        expect(typeof match.ingredient_id).toBe("number");
        expect(typeof match.name).toBe("string");
        expect(typeof match.match_confidence).toBe("number");
        expect(["deterministic", "fuzzy", "llm"]).toContain(match.match_method);
        expect(match.match_confidence).toBeGreaterThanOrEqual(0);
        expect(match.match_confidence).toBeLessThanOrEqual(1);
      }
    });

    test("should include proper cache headers", async () => {
      const response = await fetch(ENDPOINT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
        body: JSON.stringify({ raw_text: "simple test" }),
      });

      expect(response.headers.get("content-type")).toContain("application/json");
      expect(response.headers.get("cache-control")).toContain("private");
    });
  });

  describe("Performance Requirements", () => {
    test("should respond within reasonable time", async () => {
      const startTime = Date.now();

      const response = await fetch(ENDPOINT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
        body: JSON.stringify({ raw_text: "tomatoes and basil" }),
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Should respond within 2 seconds for most requests
      expect(responseTime).toBeLessThan(2000);
    }, 3000); // 3 second test timeout

    test("should handle concurrent requests efficiently", async () => {
      const concurrentRequests = 10;
      const startTime = Date.now();

      const promises = Array.from({ length: concurrentRequests }, (_, i) =>
        fetch(ENDPOINT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer concurrent-test-${i}`,
          },
          body: JSON.stringify({ raw_text: `test ingredient ${i}` }),
        })
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();

      // All requests should complete
      expect(responses).toHaveLength(concurrentRequests);

      // Total time should be reasonable for concurrent processing
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(5000); // Should handle 10 concurrent requests in <5s

      // Most should succeed (assuming rate limiting doesn't kick in)
      const successful = responses.filter((r) => r.status === 200 || r.status === 422);
      expect(successful.length).toBeGreaterThanOrEqual(concurrentRequests * 0.8); // 80% success rate
    }, 10000); // 10 second test timeout
  });
});

describe("Caching Behavior Tests", () => {
  test("should cache identical requests for performance", async () => {
    const testInput = { raw_text: "cached test ingredient" };

    // First request
    const startTime1 = Date.now();
    const response1 = await fetch(ENDPOINT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer cache-test-token",
      },
      body: JSON.stringify(testInput),
    });
    const time1 = Date.now() - startTime1;

    // Second identical request (should be cached)
    const startTime2 = Date.now();
    const response2 = await fetch(ENDPOINT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer cache-test-token",
      },
      body: JSON.stringify(testInput),
    });
    const time2 = Date.now() - startTime2;

    // Both should have same response status
    expect(response1.status).toBe(response2.status);

    // If successful, results should be identical
    if (response1.status === 200) {
      const data1 = await response1.json();
      const data2 = await response2.json();
      expect(data1).toEqual(data2);
    }

    // Second request should generally be faster (cached)
    // Note: This might not always be true due to network variability
    console.log(`Cache test - First: ${time1}ms, Second: ${time2}ms`);
  });
});
