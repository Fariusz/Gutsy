import { describe, it, expect } from "vitest";
import { z } from "zod";

// Import schemas from the API files (these would need to be exported)
// For now, we'll recreate them here for testing
const CreateLogSchema = z.object({
  log_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  notes: z.string().optional(),
  ingredients: z.array(z.string()),
  symptoms: z.array(
    z.object({
      symptom_id: z.number(),
      severity: z.number().min(1).max(5),
    })
  ),
});

const LogsQuerySchema = z.object({
  page: z.preprocess((val) => Number(val), z.number().int().min(1)).default(1),
  per_page: z.preprocess((val) => Number(val), z.number().int().min(1).max(100)).default(10),
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
        const errorPaths = result.error.errors.map(e => e.path.join('.'));
        expect(errorPaths).toContain('ingredients');
        expect(errorPaths).toContain('symptoms');
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
        expect(result.error.errors.some(e => e.path.includes('ingredients'))).toBe(true);
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
        const severityErrors = result.error.errors.filter(e => 
          e.path.some(p => p === 'severity')
        );
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
        expect(result.error.errors.some(e => e.path.includes('symptom_id'))).toBe(true);
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
  });

  describe("Schema error handling", () => {
    it("should provide detailed error information", () => {
      const invalidData = {
        log_date: "invalid",
        ingredients: 123, // Should be array
        symptoms: [
          { symptom_id: "invalid", severity: 10 }
        ]
      };

      const result = CreateLogSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThan(1);
        
        // Check that we get specific field errors
        const errorFields = result.error.errors.map(e => e.path.join('.'));
        expect(errorFields).toContain('log_date');
        expect(errorFields).toContain('ingredients');
        expect(errorFields.some(field => field.includes('symptom_id'))).toBe(true);
        expect(errorFields.some(field => field.includes('severity'))).toBe(true);
      }
    });
  });
});