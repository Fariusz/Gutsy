import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Example test file demonstrating Vitest best practices
 *
 * Guidelines demonstrated:
 * - Leverage the `vi` object for test doubles
 * - Master `vi.mock()` factory patterns
 * - Use inline snapshots for readable assertions
 * - Structure tests for maintainability
 * - Leverage TypeScript type checking in tests
 */

// Example module to test
const fetchData = async (url: string): Promise<{ data: string }> => {
  const response = await fetch(url);
  return response.json();
};

const processData = (data: { data: string }): string => {
  return data.data.toUpperCase();
};

// Example service with optional dependency
let optionalLogger: ((message: string) => void) | undefined;

const setLogger = (logger: (message: string) => void) => {
  optionalLogger = logger;
};

const logMessage = (message: string) => {
  if (optionalLogger) {
    optionalLogger(message);
  }
};

describe("Vitest Best Practices Examples", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup after each test
    optionalLogger = undefined;
  });

  describe("Using vi.fn() for function mocks", () => {
    it("should use vi.fn() to create function mocks", () => {
      // Arrange: Create a mock function using vi.fn()
      const mockFn = vi.fn();

      // Act: Call the mock function
      mockFn("test", 123);

      // Assert: Verify the function was called
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith("test", 123);
    });

    it("should use vi.fn() with return values", () => {
      // Arrange: Create a mock with return value
      const mockFn = vi.fn().mockReturnValue("mocked value");

      // Act
      const result = mockFn();

      // Assert
      expect(result).toBe("mocked value");
    });
  });

  describe("Using vi.spyOn() to monitor existing functions", () => {
    it("should use vi.spyOn() to monitor function calls", () => {
      // Arrange: Create a spy on console.log
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

      // Act
      // eslint-disable-next-line no-console
      console.log("test message");

      // Assert: Verify the function was called
      expect(consoleSpy).toHaveBeenCalledWith("test message");

      // Cleanup
      consoleSpy.mockRestore();
    });
  });

  describe("Using vi.mock() factory patterns", () => {
    // Mock at the top level - factory runs before imports
    vi.mock("global-fetch-module", () => ({
      default: vi.fn(),
    }));

    it("should use vi.mock() factory pattern", async () => {
      // Arrange: Mock fetch globally
      global.fetch = vi.fn().mockResolvedValue({
        json: vi.fn().mockResolvedValue({ data: "test data" }),
      } as unknown as Response);

      // Act
      const result = await fetchData("https://api.example.com/data");

      // Assert
      expect(result).toEqual({ data: "test data" });
      expect(global.fetch).toHaveBeenCalledWith("https://api.example.com/data");
    });
  });

  describe("Using inline snapshots", () => {
    it("should use inline snapshots for readable assertions", () => {
      // Arrange
      const complexObject = {
        user: {
          id: 1,
          name: "Test User",
          email: "test@example.com",
          preferences: {
            theme: "dark",
            notifications: true,
          },
        },
        metadata: {
          createdAt: "2023-01-01",
          updatedAt: "2023-01-02",
        },
      };

      // Assert: Use inline snapshot for complex objects
      expect(complexObject).toMatchInlineSnapshot(`
        {
          "metadata": {
            "createdAt": "2023-01-01",
            "updatedAt": "2023-01-02",
          },
          "user": {
            "email": "test@example.com",
            "id": 1,
            "name": "Test User",
            "preferences": {
              "notifications": true,
              "theme": "dark",
            },
          },
        }
      `);
    });
  });

  describe("Handling optional dependencies with smart mocking", () => {
    it("should handle optional dependencies gracefully", () => {
      // Arrange: No logger set
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

      // Act: Should not throw error
      logMessage("test message");

      // Assert: Logger not called when not set
      expect(consoleSpy).not.toHaveBeenCalled();

      // Cleanup
      consoleSpy.mockRestore();
    });

    it("should use optional logger when set", () => {
      // Arrange: Set logger
      const mockLogger = vi.fn();
      setLogger(mockLogger);

      // Act
      logMessage("test message");

      // Assert: Logger called when set
      expect(mockLogger).toHaveBeenCalledWith("test message");
    });
  });

  describe("Structuring tests for maintainability", () => {
    it("should follow Arrange-Act-Assert pattern", () => {
      // Arrange: Set up test data and mocks
      const input = { data: "test" };
      const expectedOutput = "TEST";

      // Act: Execute the function under test
      const result = processData(input);

      // Assert: Verify the result
      expect(result).toBe(expectedOutput);
    });

    it("should use descriptive test names", () => {
      // Test names should clearly describe what is being tested
      const data = { data: "hello world" };
      const result = processData(data);
      expect(result).toBe("HELLO WORLD");
    });
  });

  describe("Type checking in tests", () => {
    it("should leverage TypeScript type checking", () => {
      // TypeScript will catch type errors at compile time
      const data: { data: string } = { data: "test" };
      const result: string = processData(data);

      // Use expectTypeOf for type-level assertions (if using @vitest/ui)
      expect(typeof result).toBe("string");
      expect(result).toBe("TEST");
    });
  });
});
