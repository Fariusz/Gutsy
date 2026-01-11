/**
 * Performance monitoring utilities for API operations
 */

/**
 * Performance thresholds for monitoring
 */
export const PERFORMANCE_THRESHOLDS = {
  RPC_WARNING_MS: 2000, // Warn if RPC takes longer than 2 seconds
  RPC_ERROR_MS: 5000, // Error if RPC takes longer than 5 seconds
  CACHE_HIT_TARGET: 0.8, // Target cache hit rate of 80%
} as const;

/**
 * Performance metrics for monitoring
 */
export interface PerformanceMetrics {
  duration: number;
  operation: string;
  success: boolean;
  timestamp: number;
}

/**
 * Monitor RPC function performance and log slow queries
 * @param operation Name of the operation being monitored
 * @param rpcCall Function that executes the RPC call
 * @returns Result of the RPC call with performance monitoring
 */
export async function monitorRpcPerformance<T>(operation: string, rpcCall: () => Promise<T>): Promise<T> {
  const startTime = Date.now();
  let success = false;

  try {
    const result = await rpcCall();
    success = true;
    return result;
  } catch (error) {
    success = false;
    throw error;
  } finally {
    const duration = Date.now() - startTime;

    // Log performance metrics
    const metrics: PerformanceMetrics = {
      duration,
      operation,
      success,
      timestamp: startTime,
    };

    logRpcPerformanceMetrics(metrics);
  }
}

/**
 * Log RPC performance metrics with appropriate warning levels
 * @param metrics Performance metrics to log
 */
function logRpcPerformanceMetrics(metrics: PerformanceMetrics): void {
  const { duration, operation, success } = metrics;

  if (!success) {
    console.error(`❌ RPC operation failed: ${operation} (${duration}ms)`);
    return;
  }

  if (duration > PERFORMANCE_THRESHOLDS.RPC_ERROR_MS) {
    console.error(
      `🐌 Very slow RPC detected: ${operation} took ${duration}ms (threshold: ${PERFORMANCE_THRESHOLDS.RPC_ERROR_MS}ms)`
    );
  } else if (duration > PERFORMANCE_THRESHOLDS.RPC_WARNING_MS) {
    console.warn(
      `⚠️  Slow RPC detected: ${operation} took ${duration}ms (threshold: ${PERFORMANCE_THRESHOLDS.RPC_WARNING_MS}ms)`
    );
  } else {
    console.log(`✅ RPC completed: ${operation} (${duration}ms)`);
  }
}

/**
 * Log performance metrics for database queries
 */
export function logQueryPerformance(startTime: number, queryType: string, recordCount: number, userId?: string): void {
  const duration = Date.now() - startTime;

  // Log slow queries (over 1 second)
  if (duration > 1000) {
    console.warn(`Slow query detected: ${queryType} took ${duration}ms for ${recordCount} records`, {
      queryType,
      duration,
      recordCount,
      userId: userId ? `user_${userId.substring(0, 8)}...` : "unknown",
    });
  }

  // Log very slow queries as errors (over 5 seconds)
  if (duration > 5000) {
    console.error(`Very slow query: ${queryType} took ${duration}ms for ${recordCount} records`, {
      queryType,
      duration,
      recordCount,
      userId: userId ? `user_${userId.substring(0, 8)}...` : "unknown",
    });
  }
}

/**
 * Time a function execution and log performance
 */
export async function timeFunction<T>(fn: () => Promise<T>, operation: string, userId?: string): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await fn();
    const duration = Date.now() - startTime;

    if (duration > 500) {
      // Log operations over 500ms
      console.log(`Operation ${operation} completed in ${duration}ms`, {
        operation,
        duration,
        userId: userId ? `user_${userId.substring(0, 8)}...` : "unknown",
      });
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Operation ${operation} failed after ${duration}ms`, {
      operation,
      duration,
      error: error instanceof Error ? error.message : "Unknown error",
      userId: userId ? `user_${userId.substring(0, 8)}...` : "unknown",
    });
    throw error;
  }
}

/**
 * Cache implementation for photo URLs
 */
export class PhotoUrlCache {
  private cache = new Map<string, { url: string; expires: number }>();

  /**
   * Get cached photo URL if still valid
   */
  get(photoPath: string): string | null {
    const cached = this.cache.get(photoPath);
    if (cached && cached.expires > Date.now()) {
      return cached.url;
    }

    // Clean up expired entry
    if (cached) {
      this.cache.delete(photoPath);
    }

    return null;
  }

  /**
   * Cache photo URL with TTL
   */
  set(photoPath: string, url: string, ttlMs = 3000000): void {
    // 50 min TTL by default
    this.cache.set(photoPath, {
      url,
      expires: Date.now() + ttlMs,
    });
  }

  /**
   * Clear expired entries from cache
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (value.expires <= now) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; expired: number } {
    const now = Date.now();
    let expired = 0;

    for (const value of this.cache.values()) {
      if (value.expires <= now) {
        expired++;
      }
    }

    return {
      size: this.cache.size,
      expired,
    };
  }
}

// Global cache instance
export const photoUrlCache = new PhotoUrlCache();

// Cleanup expired cache entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(
    () => {
      photoUrlCache.cleanup();
    },
    5 * 60 * 1000
  );
}
