import type { TriggersResponse } from "../../types";

/**
 * In-memory cache for trigger analysis results
 * Improves performance by caching expensive RPC calculations
 */
export class TriggerAnalysisCache {
  private cache = new Map<string, { result: TriggersResponse; expires: number }>();
  private readonly defaultTtl = 3600000; // 1 hour in milliseconds

  /**
   * Generate cache key from analysis parameters
   * @param userId User ID for the analysis
   * @param start Start date (YYYY-MM-DD)
   * @param end End date (YYYY-MM-DD)
   * @param limit Result limit
   * @returns Unique cache key
   */
  generateKey(userId: string, start: string, end: string, limit: number): string {
    return `trigger_analysis:${userId}:${start}:${end}:${limit}`;
  }

  /**
   * Retrieve cached result if valid and not expired
   * @param key Cache key
   * @returns Cached result or null if not found/expired
   */
  get(key: string): TriggersResponse | null {
    const cached = this.cache.get(key);

    if (cached && cached.expires > Date.now()) {
      return cached.result;
    }

    // Remove expired entry
    if (cached) {
      this.cache.delete(key);
    }

    return null;
  }

  /**
   * Store result in cache with expiration
   * @param key Cache key
   * @param result Analysis result to cache
   * @param ttl Time to live in milliseconds (optional)
   */
  set(key: string, result: TriggersResponse, ttl: number = this.defaultTtl): void {
    const expires = Date.now() + ttl;
    this.cache.set(key, { result, expires });

    // Simple cleanup: remove expired entries when cache gets large
    if (this.cache.size > 1000) {
      this.cleanup();
    }
  }

  /**
   * Check if a result is cached and valid
   * @param key Cache key
   * @returns True if cached result exists and is valid
   */
  has(key: string): boolean {
    const cached = this.cache.get(key);
    return cached !== undefined && cached.expires > Date.now();
  }

  /**
   * Remove specific cache entry
   * @param key Cache key to remove
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Remove expired entries from cache
   * Called automatically when cache grows large
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, value] of this.cache.entries()) {
      if (value.expires <= now) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach((key) => this.cache.delete(key));
  }

  /**
   * Get cache statistics for monitoring
   * @returns Cache usage statistics
   */
  getStats(): { size: number; hitRate?: number } {
    return {
      size: this.cache.size,
      // Note: Hit rate tracking would require additional counters
      // This is a simplified version for basic monitoring
    };
  }
}

// Global cache instance for the application
export const triggerAnalysisCache = new TriggerAnalysisCache();
