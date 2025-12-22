/**
 * Analytics configuration constants for trigger analysis
 * Centralized configuration for statistical analysis parameters
 */

export const AnalyticsConfig = {
  /**
   * Minimum number of logs required for meaningful analysis
   */
  MIN_LOGS_THRESHOLD: 10,

  /**
   * Minimum number of times an ingredient must be consumed to be included in analysis
   */
  MIN_CONSUMPTION_THRESHOLD: 5,

  /**
   * Confidence level for statistical calculations (95%)
   */
  CONFIDENCE_LEVEL: 0.95,

  /**
   * Maximum acceptable confidence interval width for reliable results
   * Results with wider intervals are filtered out
   */
  MAX_CONFIDENCE_INTERVAL_WIDTH: 1.0,

  /**
   * Default analysis period when start date is not specified (days)
   */
  DEFAULT_ANALYSIS_PERIOD_DAYS: 30,

  /**
   * Cache TTL for trigger analysis results (milliseconds)
   * 1 hour = 3600000ms
   */
  CACHE_TTL_MINUTES: 60,

  /**
   * Performance monitoring thresholds
   */
  PERFORMANCE: {
    RPC_WARNING_MS: 2000, // Warn if RPC takes longer than 2 seconds
    RPC_ERROR_MS: 5000, // Error if RPC takes longer than 5 seconds
    CACHE_HIT_TARGET: 0.8, // Target cache hit rate of 80%
  },
} as const;

/**
 * Type for analytics configuration
 */
export type AnalyticsConfigType = typeof AnalyticsConfig;
