# API Endpoint Implementation Plan: POST /api/ingredients/normalize

## 1. Endpoint Overview

The POST /api/ingredients/normalize endpoint transforms raw ingredient text into standardized ingredient IDs for consistent data storage and analysis. This is a critical service that enables users to enter ingredients in natural language while maintaining data quality for the correlation engine. The endpoint handles:

- Deterministic ingredient matching through tokenization and database lookup
- LLM-powered fuzzy matching for unrecognized ingredients
- Confidence scoring for match quality assessment
- Fallback strategies for handling edge cases

## 2. Request Details

- **HTTP Method**: POST
- **URL Structure**: `/api/ingredients/normalize`
- **Authentication**: Required (Bearer token from Supabase Auth)
- **Content-Type**: `application/json`

### Parameters

**Required Body Parameters:**

- `raw_text` (string): Raw ingredient text to normalize (1-100 characters)

### Request Body Structure

```typescript
{
  "raw_text": "spicy tomato sauce with basil"
}
```

## 3. Used Types

### Request/Response DTOs

- `NormalizeIngredientRequest` - Request payload with raw text
- `NormalizeIngredientResponse` - Response with normalized matches
- `NormalizedIngredientMatch` - Individual ingredient match result

### Service Models

- `NormalizationCommand` - Internal service command model
- `IngredientMatch` - Raw matching result from services
- `TokenizedIngredient` - Tokenization result structure

## 4. Response Details

### Success Response (200 OK)

```typescript
{
  "data": [
    {
      "ingredient_id": 123,
      "name": "tomatoes",
      "match_confidence": 0.95,
      "match_method": "deterministic"
    },
    {
      "ingredient_id": 456,
      "name": "basil",
      "match_confidence": 0.87,
      "match_method": "fuzzy"
    }
  ],
  "raw_text": "spicy tomato sauce with basil"
}
```

### Error Responses

- **400 Bad Request**: Invalid or missing raw_text, text too long
- **401 Unauthorized**: Missing or invalid authentication token
- **422 Unprocessable Entity**: No ingredients could be matched
- **500 Internal Server Error**: Normalization service failures

## 5. Data Flow

1. **Request Reception**: Endpoint receives POST with raw ingredient text
2. **Authentication**: Validate user session for rate limiting and logging
3. **Input Validation**: Zod validation of raw_text parameter
4. **Text Preprocessing**: Clean and tokenize the raw text
5. **Deterministic Matching**: Attempt database lookup for exact/fuzzy matches
6. **LLM Fallback**: Use LLM service for unmatched tokens (optional)
7. **Confidence Filtering**: Remove matches below minimum confidence threshold
8. **Result Deduplication**: Remove duplicate ingredient matches
9. **Response Assembly**: Format results with metadata

### Processing Pipeline

```typescript
// Step 1: Text preprocessing
"spicy tomato sauce with basil"
→ ["spicy", "tomato", "sauce", "with", "basil"]

// Step 2: Deterministic matching
"tomato" → { id: 123, name: "tomatoes", confidence: 0.95, method: "deterministic" }
"basil" → { id: 456, name: "basil", confidence: 1.0, method: "deterministic" }

// Step 3: LLM fallback (for unmatched tokens)
"sauce" → LLM analysis → possible matches or skip

// Step 4: Filtering and deduplication
Remove "spicy", "with" (common modifiers)
Combine similar matches, keep highest confidence
```

## 6. Security Considerations

### Authentication & Authorization

- **User Authentication**: Required to prevent abuse and enable usage tracking
- **Rate Limiting**: Prevent excessive API calls, especially with LLM usage
- **Input Sanitization**: Validate and clean raw text input

### Data Privacy

- **Text Logging**: Consider privacy implications of logging raw ingredient text
- **LLM Data**: Ensure external LLM services don't store user data
- **Usage Analytics**: Track normalization patterns without exposing user data

## 7. Error Handling

### Input Validation Errors (400)

- Missing or empty raw_text field
- Text exceeding 100 character limit
- Invalid characters in input text

### Processing Errors (422)

- No ingredients found in text
- All matches below confidence threshold
- Text contains only stop words/modifiers

### Service Errors (500)

- Database connection failures
- LLM service timeouts or errors
- Tokenization service failures

## 8. Performance Considerations

### Optimization Strategies

- **Database Indexing**: Fast text search indexes for ingredient lookup
- **LLM Caching**: Cache LLM responses for common ingredient phrases
- **Tokenization Caching**: Cache tokenization results for repeated text
- **Async LLM Processing**: Optional async processing for non-critical paths

### Potential Bottlenecks

- **LLM API Calls**: External service latency for fuzzy matching
- **Complex Text Processing**: Multiple tokenization and matching steps
- **Database Queries**: Multiple ingredient lookups for each token

## 9. Implementation Steps

### Step 1: Create Validation Schema

```typescript
// src/lib/validation/normalization-schemas.ts
const NormalizeIngredientSchema = z.object({
  raw_text: z
    .string()
    .min(1, "Raw text cannot be empty")
    .max(100, "Raw text cannot exceed 100 characters")
    .trim()
    .refine((text) => text.length > 0, "Raw text cannot be only whitespace"),
});
```

### Step 2: Create Text Processing Service

```typescript
// src/lib/services/text-processing-service.ts
export class TextProcessingService {
  private stopWords = new Set(["with", "and", "in", "on", "the", "a", "an"]);
  private modifiers = new Set(["spicy", "hot", "cold", "fresh", "dried", "frozen"]);

  tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ") // Remove punctuation
      .split(/\s+/)
      .filter((token) => token.length > 1)
      .filter((token) => !this.stopWords.has(token))
      .filter((token) => !this.modifiers.has(token));
  }

  extractPotentialIngredients(tokens: string[]): string[] {
    // Apply heuristics to identify ingredient-like tokens
    return tokens.filter((token) => {
      // Skip very short words
      if (token.length < 3) return false;

      // Skip numbers
      if (/^\d+$/.test(token)) return false;

      // Include everything else
      return true;
    });
  }
}
```

### Step 3: Create Deterministic Matching Service

```typescript
// src/lib/services/deterministic-matching-service.ts
export class DeterministicMatchingService {
  constructor(private supabase: SupabaseClient) {}

  async findMatches(tokens: string[]): Promise<IngredientMatch[]> {
    const matches: IngredientMatch[] = [];

    for (const token of tokens) {
      // Exact match
      const exactMatch = await this.findExactMatch(token);
      if (exactMatch) {
        matches.push({
          ...exactMatch,
          match_confidence: 1.0,
          match_method: "deterministic",
        });
        continue;
      }

      // Fuzzy match with trigrams
      const fuzzyMatches = await this.findFuzzyMatches(token);
      matches.push(...fuzzyMatches);
    }

    return this.deduplicateMatches(matches);
  }

  private async findExactMatch(token: string): Promise<IngredientMatch | null> {
    const { data, error } = await this.supabase.from("ingredients").select("id, name").eq("name", token).single();

    if (error || !data) return null;

    return {
      ingredient_id: data.id,
      name: data.name,
      match_confidence: 1.0,
      match_method: "deterministic",
    };
  }

  private async findFuzzyMatches(token: string, threshold: number = 0.6): Promise<IngredientMatch[]> {
    const { data, error } = await this.supabase
      .from("ingredients")
      .select("id, name")
      .textSearch("name", token, {
        type: "websearch",
        config: "english",
      })
      .limit(3);

    if (error || !data) return [];

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
      .filter((match) => match.match_confidence >= threshold);
  }

  private calculateSimilarity(token: string, name: string): number {
    // Simple Levenshtein distance-based similarity
    const distance = this.levenshteinDistance(token.toLowerCase(), name.toLowerCase());
    const maxLength = Math.max(token.length, name.length);
    return Math.max(0, 1 - distance / maxLength);
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(matrix[j][i - 1] + 1, matrix[j - 1][i] + 1, matrix[j - 1][i - 1] + indicator);
      }
    }

    return matrix[str2.length][str1.length];
  }

  private deduplicateMatches(matches: IngredientMatch[]): IngredientMatch[] {
    const seen = new Map<number, IngredientMatch>();

    for (const match of matches) {
      const existing = seen.get(match.ingredient_id);
      if (!existing || match.match_confidence > existing.match_confidence) {
        seen.set(match.ingredient_id, match);
      }
    }

    return Array.from(seen.values());
  }
}
```

### Step 4: Create LLM Fallback Service (Optional)

```typescript
// src/lib/services/llm-normalization-service.ts
export class LLMNormalizationService {
  private cache = new Map<string, IngredientMatch[]>();

  async normalizeWithLLM(unmatchedTokens: string[], availableIngredients: string[]): Promise<IngredientMatch[]> {
    if (unmatchedTokens.length === 0) return [];

    const cacheKey = unmatchedTokens.join(",");
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const prompt = this.buildNormalizationPrompt(unmatchedTokens, availableIngredients);
      const response = await this.callLLMService(prompt);
      const matches = this.parseLLMResponse(response);

      this.cache.set(cacheKey, matches);
      return matches;
    } catch (error) {
      console.warn("LLM normalization failed:", error);
      return []; // Graceful fallback
    }
  }

  private buildNormalizationPrompt(tokens: string[], ingredients: string[]): string {
    return `
Match these ingredient tokens to the closest ingredients from the provided list:
Tokens: ${tokens.join(", ")}
Available ingredients: ${ingredients.slice(0, 100).join(", ")}

Return only exact matches with confidence scores 0-1.
Format: token -> ingredient_name (confidence)
`;
  }

  private async callLLMService(prompt: string): Promise<string> {
    // Integrate with your preferred LLM service (OpenAI, Anthropic, etc.)
    // This is a placeholder implementation
    throw new Error("LLM service not implemented");
  }

  private parseLLMResponse(response: string): IngredientMatch[] {
    // Parse LLM response and convert to IngredientMatch format
    // This would need to be implemented based on the LLM service response format
    return [];
  }
}
```

### Step 5: Create Main Normalization Service

```typescript
// src/lib/services/ingredient-normalization-service.ts
export class IngredientNormalizationService {
  constructor(
    private textProcessor: TextProcessingService,
    private deterministicMatcher: DeterministicMatchingService,
    private llmService?: LLMNormalizationService
  ) {}

  async normalizeIngredients(rawText: string): Promise<NormalizeIngredientResponse> {
    // Step 1: Tokenize and preprocess
    const tokens = this.textProcessor.tokenize(rawText);
    const ingredientTokens = this.textProcessor.extractPotentialIngredients(tokens);

    if (ingredientTokens.length === 0) {
      throw new Error("No potential ingredients found in text");
    }

    // Step 2: Deterministic matching
    const deterministicMatches = await this.deterministicMatcher.findMatches(ingredientTokens);

    // Step 3: LLM fallback for unmatched tokens (optional)
    let allMatches = deterministicMatches;
    if (this.llmService && deterministicMatches.length < ingredientTokens.length) {
      const matchedTokens = new Set(deterministicMatches.map((m) => m.name.toLowerCase()));
      const unmatchedTokens = ingredientTokens.filter(
        (token) => !Array.from(matchedTokens).some((matched) => matched.includes(token) || token.includes(matched))
      );

      if (unmatchedTokens.length > 0) {
        const llmMatches = await this.llmService.normalizeWithLLM(
          unmatchedTokens,
          await this.getAvailableIngredients()
        );
        allMatches = [...deterministicMatches, ...llmMatches];
      }
    }

    // Step 4: Filter by confidence and deduplicate
    const filteredMatches = allMatches
      .filter((match) => match.match_confidence >= 0.5)
      .sort((a, b) => b.match_confidence - a.match_confidence);

    if (filteredMatches.length === 0) {
      throw new BusinessLogicError(
        "No ingredients could be matched with sufficient confidence",
        `Raw text: "${rawText}"`
      );
    }

    return {
      data: filteredMatches,
      raw_text: rawText,
    };
  }

  private async getAvailableIngredients(): Promise<string[]> {
    const { data, error } = await this.deterministicMatcher.supabase.from("ingredients").select("name").limit(1000);

    return data?.map((i) => i.name) || [];
  }
}
```

### Step 6: Create Astro Endpoint

```typescript
// src/pages/api/ingredients/normalize.ts
export const prerender = false;

export async function POST(context: APIContext): Promise<Response> {
  try {
    const userId = await validateAuthToken(context);

    // Rate limiting check
    const rateLimiter = new RateLimiter();
    if (!rateLimiter.checkLimit(userId, 50, 60000)) {
      // 50 requests per minute
      return new Response(
        JSON.stringify({
          error: { type: "rate_limit_error", message: "Rate limit exceeded" },
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await context.request.json();
    const validatedData = NormalizeIngredientSchema.parse(body);

    const normalizationService = new IngredientNormalizationService(
      new TextProcessingService(),
      new DeterministicMatchingService(context.locals.supabase)
      // new LLMNormalizationService() // Optional
    );

    const result = await normalizationService.normalizeIngredients(validatedData.raw_text);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Step 7: Add Result Caching

```typescript
// src/lib/cache/normalization-cache.ts
export class NormalizationCache {
  private cache = new Map<string, { result: NormalizeIngredientResponse; expires: number }>();

  generateKey(rawText: string): string {
    return `normalize:${rawText.toLowerCase().trim()}`;
  }

  get(key: string): NormalizeIngredientResponse | null {
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.result;
    }
    this.cache.delete(key);
    return null;
  }

  set(key: string, result: NormalizeIngredientResponse, ttl: number = 3600000): void {
    // 1 hour
    this.cache.set(key, { result, expires: Date.now() + ttl });
  }
}
```

### Step 8: Add Database Indexes for Performance

```sql
-- supabase/migrations/20251221180000_normalization_indexes.sql
-- Full-text search index for ingredient normalization
CREATE INDEX IF NOT EXISTS ingredients_fts_idx
ON ingredients USING GIN (to_tsvector('english', name));

-- Trigram index for fuzzy matching
CREATE INDEX IF NOT EXISTS ingredients_trigram_idx
ON ingredients USING GIN (name gin_trgm_ops);

-- Ensure trigram extension is available
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### Step 9: Add Analytics and Monitoring

```typescript
// src/lib/analytics/normalization-analytics.ts
export class NormalizationAnalytics {
  async logNormalization(
    userId: string,
    rawText: string,
    matchCount: number,
    avgConfidence: number,
    processingTimeMs: number
  ): Promise<void> {
    // Log normalization patterns for improving the service
    console.log({
      event: "ingredient_normalization",
      userId,
      rawTextLength: rawText.length,
      matchCount,
      avgConfidence,
      processingTimeMs,
    });
  }

  async getFailureRate(timeWindowMs: number = 24 * 60 * 60 * 1000): Promise<number> {
    // Track normalization failure rates for monitoring
    return 0.05; // 5% placeholder
  }
}
```

### Step 10: Add Comprehensive Tests

```typescript
// tests/api/normalize.test.ts
describe("POST /api/ingredients/normalize", () => {
  test("normalizes simple ingredient names");
  test("handles complex ingredient phrases");
  test("returns appropriate confidence scores");
  test("filters low-confidence matches");
  test("handles empty or invalid input");
  test("enforces rate limiting");
  test("caches repeated normalizations");

  describe("deterministic matching", () => {
    test("finds exact ingredient matches");
    test("finds fuzzy ingredient matches");
    test("handles plural/singular variations");
  });

  describe("text processing", () => {
    test("removes stop words and modifiers");
    test("handles punctuation and special characters");
    test("tokenizes compound ingredient phrases");
  });
});
```
