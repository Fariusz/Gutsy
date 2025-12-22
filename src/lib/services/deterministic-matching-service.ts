import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { NormalizedIngredientMatch } from "../../types";

/**
 * Internal interface for ingredient match results from database queries
 */
interface IngredientMatch {
  ingredient_id: number;
  name: string;
  match_confidence: number;
  match_method: "deterministic" | "fuzzy";
}

/**
 * Deterministic Matching Service for Ingredient Normalization
 *
 * Handles database-based ingredient matching using exact matches and fuzzy text search.
 * Provides confidence scoring and deduplication of match results.
 */
export class DeterministicMatchingService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Finds ingredient matches for an array of tokens using deterministic methods
   */
  async findMatches(tokens: string[]): Promise<NormalizedIngredientMatch[]> {
    const matches: IngredientMatch[] = [];

    for (const token of tokens) {
      try {
        // First try exact match
        const exactMatch = await this.findExactMatch(token);
        if (exactMatch) {
          matches.push(exactMatch);
          continue;
        }

        // Fall back to fuzzy matching
        const fuzzyMatches = await this.findFuzzyMatches(token);
        matches.push(...fuzzyMatches);
      } catch (error) {
        console.warn(`Error matching token "${token}":`, error);
        // Continue processing other tokens
      }
    }

    return this.deduplicateMatches(matches);
  }

  /**
   * Attempts to find an exact match for a token in the ingredients database
   */
  private async findExactMatch(token: string): Promise<IngredientMatch | null> {
    const { data, error } = await this.supabase
      .from("ingredients")
      .select("id, name")
      .eq("name", token.toLowerCase())
      .maybeSingle();

    if (error) {
      console.warn(`Database error during exact match for "${token}":`, error);
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      ingredient_id: data.id,
      name: data.name,
      match_confidence: 1.0,
      match_method: "deterministic",
    };
  }

  /**
   * Finds fuzzy matches using PostgreSQL's full-text search and similarity functions
   */
  private async findFuzzyMatches(token: string, threshold = 0.6): Promise<IngredientMatch[]> {
    try {
      // Use PostgreSQL's similarity function for fuzzy matching
      // This requires the pg_trgm extension to be installed
      const { data, error } = await this.supabase.rpc("search_similar_ingredients", {
        search_term: token,
        similarity_threshold: threshold,
        max_results: 3,
      });

      if (error) {
        console.warn(`Fuzzy search error for "${token}":`, error);
        // Fall back to basic text search if RPC fails
        return this.fallbackTextSearch(token, threshold);
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map((ingredient: any) => ({
        ingredient_id: ingredient.id,
        name: ingredient.name,
        match_confidence: Math.max(0, Math.min(1, ingredient.similarity || 0)),
        match_method: "deterministic" as const,
      }));
    } catch (error) {
      console.warn(`Fuzzy matching failed for "${token}":`, error);
      return this.fallbackTextSearch(token, threshold);
    }
  }

  /**
   * Fallback text search when the fuzzy search RPC is not available
   */
  private async fallbackTextSearch(token: string, threshold: number): Promise<IngredientMatch[]> {
    try {
      // Use ILIKE for basic pattern matching
      const { data, error } = await this.supabase
        .from("ingredients")
        .select("id, name")
        .ilike("name", `%${token}%`)
        .limit(5);

      if (error || !data) {
        return [];
      }

      return data
        .map((ingredient) => {
          const confidence = this.calculateSimilarity(token, ingredient.name);
          return {
            ingredient_id: ingredient.id,
            name: ingredient.name,
            match_confidence: confidence,
            match_method: "deterministic" as const,
          };
        })
        .filter((match) => match.match_confidence >= threshold)
        .slice(0, 3); // Limit results
    } catch (error) {
      console.warn(`Fallback text search failed for "${token}":`, error);
      return [];
    }
  }

  /**
   * Calculates similarity between two strings using Levenshtein distance
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();

    if (s1 === s2) return 1.0;

    const distance = this.levenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);

    if (maxLength === 0) return 1.0;

    const similarity = Math.max(0, 1 - distance / maxLength);

    // Boost similarity for substrings
    if (s1.includes(s2) || s2.includes(s1)) {
      return Math.min(1.0, similarity + 0.2);
    }

    return similarity;
  }

  /**
   * Calculates Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    // Initialize first row and column
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    // Fill the matrix
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Removes duplicate matches, keeping the highest confidence score for each ingredient
   */
  private deduplicateMatches(matches: IngredientMatch[]): NormalizedIngredientMatch[] {
    const seen = new Map<number, IngredientMatch>();

    for (const match of matches) {
      const existing = seen.get(match.ingredient_id);
      if (!existing || match.match_confidence > existing.match_confidence) {
        seen.set(match.ingredient_id, match);
      }
    }

    return Array.from(seen.values()).sort((a, b) => b.match_confidence - a.match_confidence); // Sort by confidence descending
  }

  /**
   * Searches for ingredients that contain the given token as a substring
   */
  async findContainingMatches(token: string, limit = 5): Promise<IngredientMatch[]> {
    try {
      const { data, error } = await this.supabase
        .from("ingredients")
        .select("id, name")
        .ilike("name", `%${token}%`)
        .limit(limit);

      if (error || !data) {
        return [];
      }

      return data
        .map((ingredient) => ({
          ingredient_id: ingredient.id,
          name: ingredient.name,
          match_confidence: this.calculateSubstringConfidence(token, ingredient.name),
          match_method: "deterministic" as const,
        }))
        .filter((match) => match.match_confidence > 0.3) // Minimum threshold for substring matches
        .sort((a, b) => b.match_confidence - a.match_confidence);
    } catch (error) {
      console.warn(`Substring search failed for "${token}":`, error);
      return [];
    }
  }

  /**
   * Calculates confidence score for substring matches
   */
  private calculateSubstringConfidence(token: string, ingredientName: string): number {
    const tokenLower = token.toLowerCase();
    const nameLower = ingredientName.toLowerCase();

    // Exact match
    if (tokenLower === nameLower) return 1.0;

    // Token is at the beginning of ingredient name
    if (nameLower.startsWith(tokenLower)) {
      return 0.9 - (nameLower.length - tokenLower.length) * 0.1;
    }

    // Token is contained in ingredient name
    if (nameLower.includes(tokenLower)) {
      const lengthRatio = tokenLower.length / nameLower.length;
      return Math.max(0.3, 0.6 * lengthRatio);
    }

    return 0;
  }
}
