import type { IngredientsResponse } from "../../types";

/**
 * In-memory cache for ingredient search results
 * Provides caching with TTL to improve performance for common searches
 */
export class IngredientCache {
  private cache = new Map<string, { result: IngredientsResponse; expires: number }>();

  /**
   * Generate cache key based on search parameters
   */
  generateKey(search?: string, limit?: number): string {
    return `ingredients:${search || "all"}:${limit || 100}`;
  }

  /**
   * Get cached result if it exists and hasn't expired
   */
  get(key: string): IngredientsResponse | null {
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.result;
    }
    if (cached) {
      this.cache.delete(key); // Clean up expired entry
    }
    return null;
  }

  /**
   * Store result in cache with TTL (default 30 minutes)
   */
  set(key: string, result: IngredientsResponse, ttl = 1800000): void {
    this.cache.set(key, { result, expires: Date.now() + ttl });
  }

  /**
   * Clear all cached results
   */
  invalidate(): void {
    this.cache.clear();
  }

  /**
   * Invalidate cached results that might be affected by a specific search term
   */
  invalidateSearch(searchTerm: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter((key) => key.includes(searchTerm.toLowerCase()));
    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Get cache statistics for monitoring
   */
  getStats() {
    const now = Date.now();
    const entries = Array.from(this.cache.values());
    const expired = entries.filter((entry) => entry.expires <= now).length;
    const active = entries.length - expired;

    return {
      totalEntries: entries.length,
      activeEntries: active,
      expiredEntries: expired,
    };
  }
}
