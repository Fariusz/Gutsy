import { describe, it, expect } from "vitest";
import { TriggersQuerySchema } from "../../lib/validation/schemas";

describe("Triggers Validation Schemas", () => {
  describe("TriggersQuerySchema", () => {
    it("should validate correct trigger query parameters", () => {
      const validData = {
        start_date: "2024-01-01",
        end_date: "2024-01-31",
        limit: "10",
      };

      const result = TriggersQuerySchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          start_date: "2024-01-01",
          end_date: "2024-01-31",
          limit: 10,
        });
      }
    });

    it("should apply default limit when not provided", () => {
      const validData = {
        start_date: "2024-01-01",
        end_date: "2024-01-31",
      };

      const result = TriggersQuerySchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(10); // Default value
      }
    });

    it("should reject invalid date formats", () => {
      const invalidData = {
        start_date: "invalid-date",
        end_date: "2024-01-31",
        limit: "10",
      };

      const result = TriggersQuerySchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Invalid start date format");
      }
    });

    it("should reject invalid limit values", () => {
      const invalidData = {
        start_date: "2024-01-01",
        end_date: "2024-01-31",
        limit: "0", // Below minimum
      };

      const result = TriggersQuerySchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Number must be greater than or equal to 1");
      }
    });

    it("should reject limit values above maximum", () => {
      const invalidData = {
        start_date: "2024-01-01",
        end_date: "2024-01-31",
        limit: "100", // Above maximum of 50
      };

      const result = TriggersQuerySchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Number must be less than or equal to 50");
      }
    });

    it("should transform string limit to number", () => {
      const validData = {
        start_date: "2024-01-01",
        end_date: "2024-01-31",
        limit: "25",
      };

      const result = TriggersQuerySchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.limit).toBe("number");
        expect(result.data.limit).toBe(25);
      }
    });

    it("should handle edge case dates", () => {
      const edgeCaseData = {
        start_date: "2024-02-29", // Leap year
        end_date: "2024-12-31",
        limit: "1",
      };

      const result = TriggersQuerySchema.safeParse(edgeCaseData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.start_date).toBe("2024-02-29");
        expect(result.data.end_date).toBe("2024-12-31");
      }
    });

    it("should reject non-numeric limit strings", () => {
      const invalidData = {
        start_date: "2024-01-01",
        end_date: "2024-01-31",
        limit: "abc",
      };

      const result = TriggersQuerySchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it("should handle missing end_date", () => {
      const incompleteData = {
        start_date: "2024-01-01",
        limit: "10",
      };

      const result = TriggersQuerySchema.safeParse(incompleteData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.path.includes("end_date"))).toBe(true);
      }
    });

    it("should handle missing start_date", () => {
      const incompleteData = {
        end_date: "2024-01-31",
        limit: "10",
      };

      const result = TriggersQuerySchema.safeParse(incompleteData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.path.includes("start_date"))).toBe(true);
      }
    });

    it("should validate ISO date strings", () => {
      const isoData = {
        start_date: "2024-01-01T00:00:00Z",
        end_date: "2024-01-31T23:59:59Z",
        limit: "5",
      };

      const result = TriggersQuerySchema.safeParse(isoData);

      expect(result.success).toBe(true);
    });
  });
});
