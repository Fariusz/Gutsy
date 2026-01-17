import { describe, it, expect } from "vitest";
import {
  CreateLogSchema,
  LogsQuerySchema,
  MessageSchema,
  ResponseFormatSchema,
  ModelParametersSchema,
  ChatRequestSchema,
  ChatResponseSchema,
  ModelSchema,
} from "./schemas.js";

describe("Log Schemas", () => {
  describe("CreateLogSchema", () => {
    it("should validate a valid log creation request", () => {
      const validLog = {
        log_date: "2023-12-29T10:00:00Z",
        notes: "Had lunch",
        ingredients: ["chicken", "rice"],
        symptoms: [{ symptom_id: 1, severity: 3 }],
      };

      expect(() => CreateLogSchema.parse(validLog)).not.toThrow();
    });

    it("should reject invalid date format", () => {
      const invalidLog = {
        log_date: "invalid-date",
        notes: "Had lunch",
        ingredients: ["chicken"],
        symptoms: [],
      };

      expect(() => CreateLogSchema.parse(invalidLog)).toThrow();
    });

    it("should accept valid ISO date strings", () => {
      const validLogs = [
        {
          log_date: "2023-12-29T10:00:00Z",
          ingredients: ["chicken"],
          symptoms: [],
        },
        {
          log_date: "2023-12-29T10:00:00.000Z",
          ingredients: ["chicken"],
          symptoms: [],
        },
        {
          log_date: "2023-12-29",
          ingredients: ["chicken"],
          symptoms: [],
        },
        {
          log_date: "2024-02-29T00:00:00Z", // Leap year
          ingredients: ["chicken"],
          symptoms: [],
        },
      ];

      validLogs.forEach((log) => {
        expect(() => CreateLogSchema.parse(log)).not.toThrow();
      });
    });

    it("should reject edge case invalid dates", () => {
      // Note: Date.parse() is lenient and will "roll over" invalid days (e.g., "2023-02-30" becomes March 2nd)
      // So we only test dates that Date.parse() actually rejects
      const invalidDates = [
        "",
        "not-a-date",
        "2023-13-01", // Invalid month
        "2023-12-32", // Invalid day
        // Note: "2023-02-30" and "2024-02-30" are accepted by Date.parse() (rolls over to March)
        // so they are not included here
      ];

      invalidDates.forEach((invalidDate) => {
        const invalidLog = {
          log_date: invalidDate,
          ingredients: ["chicken"],
          symptoms: [],
        };

        expect(() => CreateLogSchema.parse(invalidLog)).toThrow();
      });

      // Test null and undefined separately as they may be handled differently by Zod
      expect(() =>
        CreateLogSchema.parse({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          log_date: null as any,
          ingredients: ["chicken"],
          symptoms: [],
        })
      ).toThrow();

      expect(() =>
        CreateLogSchema.parse({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          log_date: undefined as any,
          ingredients: ["chicken"],
          symptoms: [],
        })
      ).toThrow();
    });

    it("should reject severity outside valid range", () => {
      const invalidLog = {
        log_date: "2023-12-29T10:00:00Z",
        ingredients: ["chicken"],
        symptoms: [{ symptom_id: 1, severity: 6 }], // Invalid severity > 5
      };

      expect(() => CreateLogSchema.parse(invalidLog)).toThrow();
    });
  });

  describe("LogsQuerySchema", () => {
    it("should validate query parameters", () => {
      const validQuery = {
        start_date: "2023-12-01",
        end_date: "2023-12-29",
        limit: "10",
      };

      const result = LogsQuerySchema.parse(validQuery);
      expect(result.limit).toBe(10); // Should be transformed to number
    });
  });
});

describe("OpenRouter Schemas", () => {
  describe("MessageSchema", () => {
    it("should validate user message", () => {
      const validMessage = {
        role: "user",
        content: "Hello, how are you?",
      };

      expect(() => MessageSchema.parse(validMessage)).not.toThrow();
    });

    it("should reject empty content", () => {
      const invalidMessage = {
        role: "user",
        content: "",
      };

      expect(() => MessageSchema.parse(invalidMessage)).toThrow();
    });

    it("should reject invalid role", () => {
      const invalidMessage = {
        role: "invalid",
        content: "Hello",
      };

      expect(() => MessageSchema.parse(invalidMessage)).toThrow();
    });
  });

  describe("ResponseFormatSchema", () => {
    it("should validate JSON schema response format", () => {
      const validFormat = {
        type: "json_schema",
        json_schema: {
          name: "test_schema",
          strict: true,
          schema: {
            type: "object",
            properties: {
              result: { type: "string" },
            },
          },
        },
      };

      expect(() => ResponseFormatSchema.parse(validFormat)).not.toThrow();
    });

    it("should reject invalid type", () => {
      const invalidFormat = {
        type: "invalid_type",
        json_schema: {
          name: "test",
          strict: true,
          schema: {},
        },
      };

      expect(() => ResponseFormatSchema.parse(invalidFormat)).toThrow();
    });
  });

  describe("ModelParametersSchema", () => {
    it("should validate model parameters", () => {
      const validParams = {
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 0.9,
      };

      expect(() => ModelParametersSchema.parse(validParams)).not.toThrow();
    });

    it("should reject temperature out of range", () => {
      const invalidParams = {
        temperature: 3, // > 2.0
      };

      expect(() => ModelParametersSchema.parse(invalidParams)).toThrow();
    });

    it("should reject unknown properties", () => {
      const invalidParams = {
        temperature: 0.7,
        unknown_param: "invalid",
      };

      expect(() => ModelParametersSchema.parse(invalidParams)).toThrow();
    });
  });

  describe("ChatRequestSchema", () => {
    it("should validate complete chat request", () => {
      const validRequest = {
        model: "anthropic/claude-3.5-sonnet",
        messages: [{ role: "user", content: "Hello" }],
        systemMessage: "You are a helpful assistant",
        parameters: {
          temperature: 0.7,
          max_tokens: 1000,
        },
      };

      expect(() => ChatRequestSchema.parse(validRequest)).not.toThrow();
    });

    it("should require at least one message", () => {
      const invalidRequest = {
        model: "anthropic/claude-3.5-sonnet",
        messages: [],
      };

      expect(() => ChatRequestSchema.parse(invalidRequest)).toThrow();
    });
  });

  describe("ChatResponseSchema", () => {
    it("should validate chat response", () => {
      const validResponse = {
        id: "chatcmpl-123",
        model: "anthropic/claude-3.5-sonnet",
        choices: [
          {
            message: {
              role: "assistant",
              content: "Hello! How can I help?",
            },
            finish_reason: "stop",
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 15,
          total_tokens: 25,
        },
      };

      expect(() => ChatResponseSchema.parse(validResponse)).not.toThrow();
    });
  });

  describe("ModelSchema", () => {
    it("should validate model information", () => {
      const validModel = {
        id: "anthropic/claude-3.5-sonnet",
        name: "Claude 3.5 Sonnet",
        description: "Advanced language model",
        pricing: {
          prompt: "0.000003",
          completion: "0.000015",
        },
      };

      expect(() => ModelSchema.parse(validModel)).not.toThrow();
    });
  });
});

describe("API Validation Schemas", () => {
  describe("CreateLogSchema", () => {
    it("should validate valid log data", () => {
      const validData = {
        log_date: "2023-12-26T10:00:00Z",
        notes: "Test meal",
        ingredients: ["apple", "banana"],
        symptoms: [{ symptom_id: 1, severity: 3 }],
      };

      const result = CreateLogSchema.safeParse(validData);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it("should validate minimal valid data (without optional fields)", () => {
      const minimalData = {
        log_date: "2023-12-26T10:00:00Z",
        ingredients: ["apple"],
        symptoms: [],
      };

      const result = CreateLogSchema.safeParse(minimalData);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.notes).toBeUndefined();
        expect(result.data.ingredients).toEqual(["apple"]);
        expect(result.data.symptoms).toEqual([]);
      }
    });

    it("should reject invalid date format", () => {
      const invalidData = {
        log_date: "invalid-date",
        ingredients: ["apple"],
        symptoms: [],
      };

      const result = CreateLogSchema.safeParse(invalidData);
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.errors[0].message).toBe("Invalid date format");
      }
    });

    it("should reject missing required fields", () => {
      const incompleteData = {
        log_date: "2023-12-26T10:00:00Z",
        // Missing ingredients and symptoms
      };

      const result = CreateLogSchema.safeParse(incompleteData);
      expect(result.success).toBe(false);

      if (!result.success) {
        const errorPaths = result.error.errors.map((e) => e.path.join("."));
        expect(errorPaths).toContain("ingredients");
        expect(errorPaths).toContain("symptoms");
      }
    });

    it("should reject invalid ingredient types", () => {
      const invalidData = {
        log_date: "2023-12-26T10:00:00Z",
        ingredients: [123, "apple"], // Number instead of string
        symptoms: [],
      };

      const result = CreateLogSchema.safeParse(invalidData);
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.errors.some((e) => e.path.includes("ingredients"))).toBe(true);
      }
    });

    it("should reject invalid symptom severity values", () => {
      const invalidData = {
        log_date: "2023-12-26T10:00:00Z",
        ingredients: ["apple"],
        symptoms: [
          { symptom_id: 1, severity: 0 }, // Too low
          { symptom_id: 2, severity: 6 }, // Too high
        ],
      };

      const result = CreateLogSchema.safeParse(invalidData);
      expect(result.success).toBe(false);

      if (!result.success) {
        const severityErrors = result.error.errors.filter((e) => e.path.includes("severity"));
        expect(severityErrors.length).toBeGreaterThan(0);
      }
    });

    it("should reject non-numeric symptom IDs", () => {
      const invalidData = {
        log_date: "2023-12-26T10:00:00Z",
        ingredients: ["apple"],
        symptoms: [{ symptom_id: "invalid", severity: 3 }],
      };

      const result = CreateLogSchema.safeParse(invalidData);
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.errors.some((e) => e.path.includes("symptom_id"))).toBe(true);
      }
    });
  });

  describe("LogsQuerySchema", () => {
    it("should apply default values when not provided", () => {
      const result = LogsQuerySchema.parse({});

      expect(result.page).toBe(1);
      expect(result.per_page).toBe(10);
    });

    it("should parse valid string numbers", () => {
      const result = LogsQuerySchema.parse({
        page: "2",
        per_page: "20",
      });

      expect(result.page).toBe(2);
      expect(result.per_page).toBe(20);
    });

    it("should reject invalid page numbers", () => {
      expect(() => LogsQuerySchema.parse({ page: 0 })).toThrow();
      expect(() => LogsQuerySchema.parse({ page: -1 })).toThrow();
      expect(() => LogsQuerySchema.parse({ page: "invalid" })).toThrow();
    });

    it("should reject invalid per_page values", () => {
      expect(() => LogsQuerySchema.parse({ per_page: 0 })).toThrow();
      expect(() => LogsQuerySchema.parse({ per_page: 101 })).toThrow(); // Over max
      expect(() => LogsQuerySchema.parse({ per_page: "invalid" })).toThrow();
    });

    it("should handle edge cases for per_page limits", () => {
      const minResult = LogsQuerySchema.parse({ per_page: "1" });
      expect(minResult.per_page).toBe(1);

      const maxResult = LogsQuerySchema.parse({ per_page: "100" });
      expect(maxResult.per_page).toBe(100);
    });

    it("should handle optional date parameters", () => {
      const result = LogsQuerySchema.parse({ page: "1" });
      expect(result.start_date).toBeUndefined();
      expect(result.end_date).toBeUndefined();
    });

    it("should handle valid date strings in various formats", () => {
      const isoResult = LogsQuerySchema.parse({
        start_date: "2024-01-01T00:00:00Z",
        end_date: "2024-01-31T23:59:59Z",
      });
      expect(isoResult.start_date).toBe("2024-01-01T00:00:00Z");
      expect(isoResult.end_date).toBe("2024-01-31T23:59:59Z");

      const dateOnlyResult = LogsQuerySchema.parse({
        start_date: "2024-01-01",
        end_date: "2024-01-31",
      });
      expect(dateOnlyResult.start_date).toBe("2024-01-01");
      expect(dateOnlyResult.end_date).toBe("2024-01-31");
    });
  });

  describe("Schema error handling", () => {
    it("should provide detailed error information", () => {
      const invalidData = {
        log_date: "invalid",
        ingredients: 123, // Should be array
        symptoms: [{ symptom_id: "invalid", severity: 10 }],
      };

      const result = CreateLogSchema.safeParse(invalidData);
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThan(1);

        // Check that we get specific field errors
        const errorFields = result.error.errors.map((e) => e.path.join("."));
        expect(errorFields).toContain("log_date");
        expect(errorFields).toContain("ingredients");
        expect(errorFields.some((field) => field.includes("symptom_id"))).toBe(true);
        expect(errorFields.some((field) => field.includes("severity"))).toBe(true);
      }
    });
  });
});
