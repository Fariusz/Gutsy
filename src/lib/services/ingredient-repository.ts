import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { Ingredient } from "../../types";
import type { IngredientSearchQuery } from "../validation/ingredient-schemas";

/**
 * Repository layer for ingredient database operations
 * Handles all direct database interactions for ingredients
 */
export class IngredientRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Search ingredients with optional name filtering and result limiting
   * Uses prefix matching for better performance and relevance
   */
  async searchIngredients(query: IngredientSearchQuery): Promise<Ingredient[]> {
    let dbQuery = this.supabase.from("ingredients").select("id, name, created_at").limit(query.limit);

    if (query.search) {
      // Use prefix matching for better performance
      dbQuery = dbQuery.ilike("name", `${query.search}%`);
    }

    // Order alphabetically for now (will add relevance sorting in post-processing)
    dbQuery = dbQuery.order("name");

    const { data, error } = await dbQuery;

    if (error) {
      throw new Error(`Ingredient search failed: ${error.message}`);
    }

    // Post-process for better ordering when searching
    if (query.search && data) {
      return this.sortSearchResults(data, query.search);
    }

    return data || [];
  }

  /**
   * Sort search results by relevance:
   * 1. Exact matches first
   * 2. Prefix matches next
   * 3. Shorter names first
   * 4. Alphabetical order
   */
  private sortSearchResults(ingredients: Ingredient[], searchTerm: string): Ingredient[] {
    const searchLower = searchTerm.toLowerCase();

    return ingredients.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();

      // Exact matches first
      const aExact = aName === searchLower ? 1 : 0;
      const bExact = bName === searchLower ? 1 : 0;
      if (aExact !== bExact) return bExact - aExact;

      // Prefix matches next
      const aPrefix = aName.startsWith(searchLower) ? 1 : 0;
      const bPrefix = bName.startsWith(searchLower) ? 1 : 0;
      if (aPrefix !== bPrefix) return bPrefix - aPrefix;

      // Shorter names first
      const lengthDiff = a.name.length - b.name.length;
      if (lengthDiff !== 0) return lengthDiff;

      // Alphabetical order
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Get ingredient by ID for validation purposes
   */
  async getIngredientById(id: number): Promise<Ingredient | null> {
    const { data, error } = await this.supabase.from("ingredients").select("*").eq("id", id).single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Not found
      }
      throw new Error(`Failed to get ingredient: ${error.message}`);
    }

    return data;
  }
}
