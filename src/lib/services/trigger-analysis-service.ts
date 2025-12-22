import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type {
  TriggersResponse,
  TriggerResponse,
  TriggerAnalysisMeta,
  DateRange,
  ConfidenceInterval,
} from "../../types";
import type {
  TriggerAnalysisQuery,
  TriggerCalculationResult,
  StatisticalThresholds,
} from "../validation/trigger-schemas";
import { BusinessLogicError, InsufficientDataError } from "../utils/error-handlers";
import { triggerAnalysisCache } from "../cache/trigger-analysis-cache";
import { monitorRpcPerformance } from "../utils/performance-monitor";

/**
 * Configuration constants for trigger analysis
 */
const ANALYTICS_CONFIG = {
  MIN_LOGS_THRESHOLD: 10,
  MIN_CONSUMPTION_THRESHOLD: 5,
  CONFIDENCE_LEVEL: 0.95,
  MAX_CONFIDENCE_INTERVAL_WIDTH: 1.0,
  DEFAULT_ANALYSIS_PERIOD_DAYS: 30,
} as const;

/**
 * Service for performing trigger analysis and correlation calculations
 * Handles communication with the get_top_triggers RPC function
 * Includes caching and performance monitoring
 */
export class TriggerAnalysisService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Perform trigger analysis for a user within a specified date range
   * Uses caching to improve performance for repeated queries
   * @param query Analysis query parameters
   * @returns Trigger analysis results with metadata
   */
  async getTriggerAnalysis(query: TriggerAnalysisQuery): Promise<TriggersResponse> {
    const dateRange = this.calculateDateRange(query.start, query.end);

    // Check cache first
    const cacheKey = triggerAnalysisCache.generateKey(query.userId, dateRange.start, dateRange.end, query.limit);

    const cachedResult = triggerAnalysisCache.get(cacheKey);
    if (cachedResult) {
      console.log(`✅ Cache hit for trigger analysis: ${cacheKey}`);
      return cachedResult;
    }

    console.log(`⚡ Cache miss for trigger analysis: ${cacheKey}`);

    try {
      // First check if user has sufficient data for analysis
      await this.validateDataSufficiency(query.userId, dateRange);

      // Execute the RPC function with performance monitoring
      const rpcResult = await monitorRpcPerformance("get_top_triggers", async () => {
        const { data, error } = await this.supabase.rpc("get_top_triggers", {
          p_user_id: query.userId,
          p_start_date: dateRange.start,
          p_end_date: dateRange.end,
          p_limit: query.limit,
        });

        if (error) {
          console.error("RPC function error:", error);
          throw new BusinessLogicError("Failed to calculate trigger analysis", error.message);
        }

        return data;
      });

      if (!rpcResult || rpcResult.length === 0) {
        throw new InsufficientDataError("No trigger correlations found for the specified criteria");
      }

      // Transform RPC results to API response format
      const triggers = rpcResult.map(this.mapRpcResultToTriggerResponse);
      const meta = await this.buildAnalysisMeta(query.userId, dateRange, query.limit);

      const result: TriggersResponse = { data: triggers, meta };

      // Cache the result for future requests
      triggerAnalysisCache.set(cacheKey, result);

      return result;
    } catch (error) {
      if (error instanceof BusinessLogicError) {
        throw error;
      }

      if (error instanceof Error && error.message.includes("Insufficient data")) {
        throw new InsufficientDataError(error.message);
      }

      throw new BusinessLogicError(
        "Unexpected error during trigger analysis",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Calculate date range with defaults if not provided
   */
  private calculateDateRange(start?: string, end?: string): DateRange {
    const endDate = end || new Date().toISOString().split("T")[0];
    const startDate =
      start ||
      new Date(Date.now() - ANALYTICS_CONFIG.DEFAULT_ANALYSIS_PERIOD_DAYS * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

    return { start: startDate, end: endDate };
  }

  /**
   * Validate that user has sufficient data for meaningful analysis
   */
  private async validateDataSufficiency(userId: string, dateRange: DateRange): Promise<void> {
    const { count, error } = await this.supabase
      .from("logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("log_date", dateRange.start)
      .lte("log_date", dateRange.end);

    if (error) {
      throw new BusinessLogicError("Failed to validate data sufficiency", error.message);
    }

    if (!count || count < ANALYTICS_CONFIG.MIN_LOGS_THRESHOLD) {
      throw new InsufficientDataError(
        `Minimum ${ANALYTICS_CONFIG.MIN_LOGS_THRESHOLD} logs required for analysis, found ${count || 0}`
      );
    }
  }

  /**
   * Transform RPC result to API response format
   */
  private mapRpcResultToTriggerResponse(rpcResult: TriggerCalculationResult): TriggerResponse {
    return {
      ingredient_id: rpcResult.ingredient_id,
      name: rpcResult.ingredient_name,
      consumption_count: rpcResult.consumption_count,
      avg_severity_when_present: Number(rpcResult.avg_severity_when_present),
      baseline_avg_severity: Number(rpcResult.baseline_avg_severity),
      trigger_score: Number(rpcResult.trigger_score),
      confidence_interval: {
        lower: Number(rpcResult.confidence_lower),
        upper: Number(rpcResult.confidence_upper),
        width: Number(rpcResult.confidence_width),
      },
    };
  }

  /**
   * Build analysis metadata for the response
   */
  private async buildAnalysisMeta(userId: string, dateRange: DateRange, limit: number): Promise<TriggerAnalysisMeta> {
    // Get total log count for the period
    const { count: totalLogs } = await this.supabase
      .from("logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("log_date", dateRange.start)
      .lte("log_date", dateRange.end);

    return {
      date_range: dateRange,
      total_logs: totalLogs || 0,
      min_consumption_threshold: ANALYTICS_CONFIG.MIN_CONSUMPTION_THRESHOLD,
      min_logs_threshold: ANALYTICS_CONFIG.MIN_LOGS_THRESHOLD,
      confidence_level: ANALYTICS_CONFIG.CONFIDENCE_LEVEL,
    };
  }
}
