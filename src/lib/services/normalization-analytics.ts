/**
 * Analytics event data for ingredient normalization
 */
interface NormalizationEvent {
  userId: string;
  rawText: string;
  matchCount: number;
  avgConfidence: number;
  processingTimeMs: number;
  method: "deterministic" | "llm" | "hybrid";
  cacheHit: boolean;
  timestamp: number;
}

/**
 * Service for tracking and analyzing ingredient normalization patterns
 */
export class NormalizationAnalytics {
  private events: NormalizationEvent[] = [];
  private readonly maxEvents = 10000; // Keep last 10k events in memory

  /**
   * Logs a normalization event for analysis
   */
  async logNormalization(
    userId: string,
    rawText: string,
    matchCount: number,
    avgConfidence: number,
    processingTimeMs: number,
    method: "deterministic" | "llm" | "hybrid" = "deterministic",
    cacheHit = false
  ): Promise<void> {
    const event: NormalizationEvent = {
      userId,
      rawText: this.sanitizeText(rawText),
      matchCount,
      avgConfidence,
      processingTimeMs,
      method,
      cacheHit,
      timestamp: Date.now(),
    };

    this.events.push(event);

    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Log to console for development (replace with proper logging in production)
    if (import.meta.env.DEV) {
      console.log("Normalization event:", {
        rawTextLength: rawText.length,
        matchCount,
        avgConfidence: avgConfidence.toFixed(3),
        processingTimeMs,
        method,
        cacheHit,
      });
    }
  }

  /**
   * Calculates failure rate over specified time window
   */
  getFailureRate(timeWindowMs: number = 24 * 60 * 60 * 1000): number {
    const cutoff = Date.now() - timeWindowMs;
    const recentEvents = this.events.filter((e) => e.timestamp > cutoff);

    if (recentEvents.length === 0) return 0;

    const failures = recentEvents.filter((e) => e.matchCount === 0);
    return failures.length / recentEvents.length;
  }

  /**
   * Gets performance statistics for monitoring
   */
  getPerformanceStats(timeWindowMs: number = 24 * 60 * 60 * 1000): {
    totalRequests: number;
    avgProcessingTime: number;
    avgConfidence: number;
    cacheHitRate: number;
    methodDistribution: Record<string, number>;
    failureRate: number;
  } {
    const cutoff = Date.now() - timeWindowMs;
    const recentEvents = this.events.filter((e) => e.timestamp > cutoff);

    if (recentEvents.length === 0) {
      return {
        totalRequests: 0,
        avgProcessingTime: 0,
        avgConfidence: 0,
        cacheHitRate: 0,
        methodDistribution: {},
        failureRate: 0,
      };
    }

    const cacheHits = recentEvents.filter((e) => e.cacheHit).length;
    const avgProcessingTime = recentEvents.reduce((sum, e) => sum + e.processingTimeMs, 0) / recentEvents.length;
    const avgConfidence =
      recentEvents.filter((e) => e.matchCount > 0).reduce((sum, e) => sum + e.avgConfidence, 0) /
      Math.max(1, recentEvents.filter((e) => e.matchCount > 0).length);

    const methodDistribution: Record<string, number> = {};
    recentEvents.forEach((e) => {
      methodDistribution[e.method] = (methodDistribution[e.method] || 0) + 1;
    });

    return {
      totalRequests: recentEvents.length,
      avgProcessingTime,
      avgConfidence,
      cacheHitRate: cacheHits / recentEvents.length,
      methodDistribution,
      failureRate: this.getFailureRate(timeWindowMs),
    };
  }

  /**
   * Gets most commonly failed normalization patterns
   */
  getFailurePatterns(limit = 10): { pattern: string; count: number }[] {
    const failures = this.events.filter((e) => e.matchCount === 0);
    const patterns = new Map<string, number>();

    failures.forEach((e) => {
      const pattern = this.extractPattern(e.rawText);
      patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
    });

    return Array.from(patterns.entries())
      .map(([pattern, count]) => ({ pattern, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Sanitizes raw text for safe logging (removes PII)
   */
  private sanitizeText(text: string): string {
    return text.replace(/[0-9]/g, "X"); // Replace numbers with X
  }

  /**
   * Extracts pattern from text for failure analysis
   */
  private extractPattern(text: string): string {
    return text
      .toLowerCase()
      .replace(/[0-9]+/g, "NUM")
      .replace(/\b(the|a|an|with|and|or|in|on|of)\b/g, "STOP")
      .trim();
  }

  /**
   * Exports events for external analysis (last N events)
   */
  exportEvents(limit = 1000): NormalizationEvent[] {
    return this.events.slice(-limit);
  }
}

// Singleton analytics instance
export const normalizationAnalytics = new NormalizationAnalytics();
