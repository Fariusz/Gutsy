import { z } from "zod";

/**
 * Validation schema for GET /api/ingredients query parameters
 * Enforces search term limits and reasonable result limits
 */
export const IngredientsQuerySchema = z.object({
  search: z
    .string()
    .min(1, "Search term must be at least 1 character")
    .max(100, "Search term cannot exceed 100 characters")
    .optional(),
  limit: z.coerce
    .number()
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(500, "Limit cannot exceed 500")
    .default(100),
});

/**
 * Validation schema for ingredient normalization requests
 */
export const NormalizeIngredientSchema = z.object({
  raw_text: z.string().min(1, "Raw text is required").max(100, "Raw text must be 100 characters or less"),
});

/**
 * Validation schema for creating a new log entry
 */
export const CreateLogSchema = z.object({
  log_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .refine((date) => !Number.isNaN(Date.parse(date)), "Invalid date format"),
  notes: z.string().max(1000, "Notes must be 1000 characters or less").optional(),
  meal_photo: z.string().optional(),
  ingredients: z
    .array(
      z.object({
        ingredient_id: z.number().int().positive().optional(),
        raw_text: z.string().min(1).max(100).optional(),
      })
    )
    .min(1, "At least one ingredient is required")
    .refine(
      (items) => items.every((item) => item.ingredient_id || item.raw_text),
      "Each ingredient must have either ingredient_id or raw_text"
    ),
  symptoms: z
    .array(
      z.object({
        symptom_id: z.number().int().positive(),
        severity: z.number().int().min(1).max(5),
      })
    )
    .min(1, "At least one symptom is required"),
});

/**
 * Validation schema for GET /api/logs query parameters
 * Supports pagination and date range filtering
 */
export const LogsQuerySchema = z
  .object({
    start: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format")
      .refine((date) => !Number.isNaN(Date.parse(date)), "Invalid start date format")
      .optional(),
    end: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format")
      .refine((date) => !Number.isNaN(Date.parse(date)), "Invalid end date format")
      .optional(),
    page: z.coerce.number().int("Page must be an integer").min(1, "Page must be at least 1").default(1),
    limit: z.coerce
      .number()
      .int("Limit must be an integer")
      .min(1, "Limit must be at least 1")
      .max(100, "Limit cannot exceed 100")
      .default(20),
  })
  .refine(
    (data) => {
      if (data.start && data.end) {
        return new Date(data.start) <= new Date(data.end);
      }
      return true;
    },
    { message: "End date must be after start date" }
  );

/**
 * Type inference for the CreateLogSchema
 */
export type CreateLogValidation = z.infer<typeof CreateLogSchema>;

export type IngredientsQueryParams = z.infer<typeof IngredientsQuerySchema>;

export type LogsQueryParams = z.infer<typeof LogsQuerySchema>;

/**
 * Internal service query model for ingredient search
 */
export interface IngredientSearchQuery {
  search?: string;
  limit: number;
}

/**
 * Internal service query model for log retrieval with pagination
 */
export interface GetLogsQuery {
  userId: string;
  start?: string;
  end?: string;
  page: number;
  limit: number;
}
