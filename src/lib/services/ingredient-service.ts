import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { IngredientResponse, IngredientsResponse } from "../../types";
import type { IngredientSearchQuery } from "../validation/ingredient-schemas";
import { IngredientRepository } from "./ingredient-repository";
import { IngredientCache } from "../cache/ingredient-cache";

/**
 * Service layer for ingredient operations
 * Handles business logic, caching, and coordination between repository and cache
 */
export class IngredientService {
  private repository: IngredientRepository;
  private cache: IngredientCache;

  constructor(
    private supabase: SupabaseClient<Database>,
    cache?: IngredientCache
  ) {
    this.repository = new IngredientRepository(supabase);
    this.cache = cache || new IngredientCache();
  }

  /**
   * Search ingredients with caching support
   * Returns cached results when available, otherwise queries database
   */
  async searchIngredients(query: IngredientSearchQuery): Promise<IngredientsResponse> {
    const cacheKey = this.cache.generateKey(query.search, query.limit);
    const cached = this.cache.get(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const ingredients = await this.repository.searchIngredients(query);

      const result: IngredientsResponse = {
        data: ingredients.map((ing) => ({
          id: ing.id,
          name: ing.name,
          source: "canonical" as const,
        })),
      };

      // Cache the result for future requests
      this.cache.set(cacheKey, result);

      return result;
    } catch (error) {
      // Log error for monitoring (in production, use proper logging)
      console.error("Ingredient search failed:", error);
      throw new Error("Failed to search ingredients. Please try again later.");
    }
  }

  /**
   * Get ingredient by ID with validation
   */
  async getIngredientById(id: number): Promise<IngredientResponse | null> {
    try {
      const ingredient = await this.repository.getIngredientById(id);

      if (!ingredient) {
        return null;
      }

      return {
        id: ingredient.id,
        name: ingredient.name,
        source: "canonical" as const,
      };
    } catch (error) {
      console.error("Failed to get ingredient by ID:", error);
      throw new Error("Failed to retrieve ingredient. Please try again later.");
    }
  }

  /**
   * Invalidate cache for ingredient searches
   * Useful when ingredient data is updated
   */
  invalidateCache(): void {
    this.cache.invalidate();
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats() {
    return this.cache.getStats();
  }
}
