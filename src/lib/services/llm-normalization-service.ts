/**
 * LLM-powered ingredient normalization fallback service
 *
 * Provides AI-assisted ingredient matching for tokens that cannot be matched
 * through deterministic methods. Includes caching and graceful error handling.
 */

interface LLMIngredientMatch {
  ingredient_id: number;
  name: string;
  match_confidence: number;
  match_method: "llm";
}

interface CachedLLMResult {
  matches: LLMIngredientMatch[];
  expires: number;
}

/**
 * LLM Normalization Service for handling unmatched ingredient tokens
 * Optional service that can be disabled without affecting core functionality
 */
export class LLMNormalizationService {
  private cache = new Map<string, CachedLLMResult>();
  private readonly cacheTTL = 3600000; // 1 hour
  private readonly maxCacheSize = 1000;

  constructor(
    private readonly enabled = false,
    private readonly apiKey?: string,
    private readonly apiUrl?: string
  ) {
    if (this.enabled && (!this.apiKey || !this.apiUrl)) {
      console.warn("LLM service enabled but missing API configuration");
      this.enabled = false;
    }
  }

  /**
   * Attempts to normalize unmatched tokens using LLM assistance
   */
  async normalizeWithLLM(unmatchedTokens: string[], availableIngredients: string[]): Promise<LLMIngredientMatch[]> {
    if (!this.enabled || unmatchedTokens.length === 0) {
      return [];
    }

    const cacheKey = this.generateCacheKey(unmatchedTokens);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const matches = await this.performLLMMatching(unmatchedTokens, availableIngredients);
      this.setCache(cacheKey, matches);
      return matches;
    } catch (error) {
      console.warn("LLM normalization failed, returning empty results:", error);
      return []; // Graceful fallback
    }
  }

  /**
   * Performs the actual LLM API call for ingredient matching
   */
  private async performLLMMatching(tokens: string[], ingredients: string[]): Promise<LLMIngredientMatch[]> {
    const prompt = this.buildNormalizationPrompt(tokens, ingredients.slice(0, 200)); // Limit context

    const response = await this.callLLMAPI(prompt);
    return this.parseLLMResponse(response, ingredients);
  }

  /**
   * Builds a structured prompt for ingredient normalization
   */
  private buildNormalizationPrompt(tokens: string[], ingredients: string[]): string {
    return `You are a food ingredient matching expert. Match the following ingredient tokens to the closest ingredients from the provided canonical list.

TOKENS TO MATCH: ${tokens.join(", ")}

CANONICAL INGREDIENTS: ${ingredients.join(", ")}

RULES:
1. Only match tokens that clearly represent food ingredients
2. Return exact matches from the canonical list only
3. Assign confidence scores from 0.5 to 1.0
4. If no good match exists, don't force a match
5. Consider plural/singular variations and common abbreviations

FORMAT YOUR RESPONSE AS JSON:
{
  "matches": [
    {
      "token": "original_token",
      "ingredient": "exact_canonical_name",
      "confidence": 0.85
    }
  ]
}`;
  }

  /**
   * Makes API call to LLM service with proper error handling and retries
   */
  private async callLLMAPI(prompt: string): Promise<string> {
    if (!this.apiKey || !this.apiUrl) {
      throw new Error("LLM API configuration missing");
    }

    const maxRetries = 2;
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(this.apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini", // Cost-effective model for simple matching
            messages: [
              {
                role: "system",
                content:
                  "You are a food ingredient matching expert. Always respond with valid JSON. Be conservative with matches - only match when confident.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            max_tokens: 300,
            temperature: 0.1, // Low temperature for consistent results
            response_format: { type: "json_object" },
          }),
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        if (!response.ok) {
          throw new Error(`LLM API error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || "";
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries - 1) {
          // Wait before retry with exponential backoff
          await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        }
      }
    }

    throw lastError;
  }

  /**
   * Parses LLM response and converts to internal match format
   */
  private parseLLMResponse(response: string, availableIngredients: string[]): LLMIngredientMatch[] {
    try {
      // Create ingredient name to ID mapping
      const ingredientMap = new Map<string, number>();
      availableIngredients.forEach((name, index) => {
        ingredientMap.set(name.toLowerCase(), index + 1); // Placeholder IDs
      });

      const parsed = JSON.parse(response);
      const matches: LLMIngredientMatch[] = [];

      if (parsed.matches && Array.isArray(parsed.matches)) {
        for (const match of parsed.matches) {
          const { ingredient, confidence } = match;

          if (!ingredient || typeof confidence !== "number") continue;

          const ingredientId = ingredientMap.get(ingredient.toLowerCase());
          if (!ingredientId) continue; // Skip if not in canonical list

          // Validate confidence range
          const validatedConfidence = Math.max(0.5, Math.min(1.0, confidence));

          matches.push({
            ingredient_id: ingredientId,
            name: ingredient,
            match_confidence: validatedConfidence,
            match_method: "llm",
          });
        }
      }

      return matches;
    } catch (error) {
      console.warn("Failed to parse LLM response:", error);
      return [];
    }
  }

  /**
   * Generates cache key for token combination
   */
  private generateCacheKey(tokens: string[]): string {
    return `llm:${tokens.sort().join("|")}`;
  }

  /**
   * Retrieves matches from cache if not expired
   */
  private getFromCache(key: string): LLMIngredientMatch[] | null {
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.matches;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  /**
   * Stores matches in cache with expiration
   */
  private setCache(key: string, matches: LLMIngredientMatch[]): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      matches,
      expires: Date.now() + this.cacheTTL,
    });
  }

  /**
   * Gets current cache statistics
   */
  getCacheStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
    };
  }

  /**
   * Clears the LLM response cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Checks if LLM service is enabled and configured
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}
