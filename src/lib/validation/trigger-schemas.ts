import { z } from "zod";

/**
 * Validation schema for GET /api/triggers query parameters
 * Enforces date format, range validation, and limit constraints
 */
export const TriggersQuerySchema = z
  .object({
    start: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format")
      .optional(),
    end: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format")
      .optional(),
    limit: z.coerce
      .number()
      .int("Limit must be an integer")
      .min(1, "Limit must be at least 1")
      .max(50, "Limit cannot exceed 50")
      .default(10),
  })
  .refine(
    (data) => {
      const now = new Date().toISOString().split("T")[0];

      // End date cannot be in future
      if (data.end && data.end > now) {
        return false;
      }

      // Start date must be before or equal to end date
      if (data.start && data.end) {
        return new Date(data.start) <= new Date(data.end);
      }

      return true;
    },
    {
      message: "Invalid date range: end date cannot be in future and start must be before end",
    }
  );

export type TriggersQueryParams = z.infer<typeof TriggersQuerySchema>;

/**
 * Internal service query model for trigger analysis
 */
export interface TriggerAnalysisQuery {
  userId: string;
  start?: string;
  end?: string;
  limit: number;
}

/**
 * Raw result from get_top_triggers RPC function
 */
export interface TriggerCalculationResult {
  ingredient_id: number;
  ingredient_name: string;
  consumption_count: number;
  avg_severity_when_present: number;
  baseline_avg_severity: number;
  trigger_score: number;
  confidence_lower: number;
  confidence_upper: number;
  confidence_width: number;
}

/**
 * Configuration for trigger analysis thresholds
 */
export interface StatisticalThresholds {
  minLogsThreshold: number;
  minConsumptionThreshold: number;
  confidenceLevel: number;
  maxConfidenceIntervalWidth: number;
}
