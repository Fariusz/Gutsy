import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { 
  NormalizeIngredientResponse, 
  NormalizedIngredientMatch 
} from "../../types";

import { TextProcessingService } from "./text-processing-service";
import { DeterministicMatchingService } from "./deterministic-matching-service";
import { LLMNormalizationService } from "./llm-normalization-service";
import { normalizationCache } from "../cache/normalization-cache";
import { normalizationAnalytics } from "./normalization-analytics";

/**
 * Internal command model for normalization operations
 */
interface NormalizationCommand {
  rawText: string;
  userId?: string;
  minConfidence: number;
  maxResults: number;
}

/**
 * Business logic error for normalization failures
 */
export class NormalizationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: string
  ) {
    super(message);
    this.name = 'NormalizationError';
  }
}

/**
 * Main orchestration service for ingredient normalization
 * 
 * Coordinates text processing, deterministic matching, and optional LLM fallback
 * to transform raw ingredient text into standardized ingredient IDs.
 */
export class IngredientNormalizationService {
  private readonly textProcessor: TextProcessingService;
  private readonly deterministicMatcher: DeterministicMatchingService;
  private readonly llmService?: LLMNormalizationService;

  constructor(
    private readonly supabase: SupabaseClient<Database>,
    options: {
      enableLLM?: boolean;
      llmApiKey?: string;
      llmApiUrl?: string;
    } = {}
  ) {
    this.textProcessor = new TextProcessingService();
    this.deterministicMatcher = new DeterministicMatchingService(supabase);
    
    if (options.enableLLM) {
      this.llmService = new LLMNormalizationService(
        true,
        options.llmApiKey,
        options.llmApiUrl
      );
    }
  }

  /**
   * Main normalization method that orchestrates the entire process
   * Includes caching, analytics, and performance monitoring
   */
  async normalizeIngredients(
    rawText: string,
    options: {
      userId?: string;
      minConfidence?: number;
      maxResults?: number;
    } = {}
  ): Promise<NormalizeIngredientResponse> {
    const startTime = Date.now();
    const cleanedText = this.textProcessor.cleanText(rawText.trim());
    
    // Check cache first
    const cacheKey = normalizationCache.generateKey(cleanedText);
    const cached = normalizationCache.get(cacheKey);
    if (cached) {
      // Log cache hit for analytics
      if (options.userId) {
        await normalizationAnalytics.logNormalization(
          options.userId,
          cleanedText,
          cached.data.length,
          cached.data.length > 0 ? cached.data.reduce((sum, m) => sum + m.match_confidence, 0) / cached.data.length : 0,
          Date.now() - startTime,
          'deterministic',
          true // cache hit
        );
      }
      return cached;
    }

    const command: NormalizationCommand = {
      rawText: cleanedText,
      userId: options.userId,
      minConfidence: options.minConfidence ?? 0.5,
      maxResults: options.maxResults ?? 10
    };

    try {
      // Step 1: Validate input
      if (!command.rawText) {
        throw new NormalizationError(
          'Input text is empty after preprocessing',
          'EMPTY_INPUT',
          `Original text: "${rawText}"`
        );
      }

      // Step 2: Tokenize and extract potential ingredients
      const tokens = this.textProcessor.tokenize(command.rawText);
      const ingredientTokens = this.textProcessor.extractPotentialIngredients(tokens);
      
      if (ingredientTokens.length === 0) {
        throw new NormalizationError(
          'No potential ingredients found in text',
          'NO_INGREDIENTS',
          `Processed tokens: [${tokens.join(', ')}]`
        );
      }

      // Step 3: Deterministic matching
      let allMatches = await this.deterministicMatcher.findMatches(ingredientTokens);
      let method: 'deterministic' | 'llm' | 'hybrid' = 'deterministic';

      // Step 4: Optional LLM fallback
      if (this.llmService && allMatches.length < ingredientTokens.length) {
        try {
          const matchedIngredients = new Set(allMatches.map(m => m.name.toLowerCase()));
          const unmatchedTokens = ingredientTokens.filter(token => 
            !Array.from(matchedIngredients).some(matched => 
              matched.includes(token.toLowerCase()) || token.toLowerCase().includes(matched)
            )
          );

          if (unmatchedTokens.length > 0) {
            const availableIngredients = await this.getAvailableIngredients();
            const llmMatches = await this.llmService.normalizeWithLLM(
              unmatchedTokens,
              availableIngredients
            );
            
            if (llmMatches.length > 0) {
              allMatches = [...allMatches, ...llmMatches];
              method = allMatches.some(m => m.match_method === 'deterministic') ? 'hybrid' : 'llm';
            }
          }
        } catch (llmError) {
          console.warn('LLM normalization failed, continuing with deterministic results:', llmError);
        }
      }

      // Step 5: Filter and sort results
      const filteredMatches = allMatches
        .filter(match => match.match_confidence >= command.minConfidence)
        .sort((a, b) => b.match_confidence - a.match_confidence)
        .slice(0, command.maxResults);

      if (filteredMatches.length === 0) {
        throw new NormalizationError(
          'No ingredients could be matched with sufficient confidence',
          'INSUFFICIENT_CONFIDENCE',
          `Min confidence: ${command.minConfidence}, found ${allMatches.length} matches below threshold`
        );
      }

      // Step 6: Build response
      const response: NormalizeIngredientResponse = {
        data: filteredMatches,
        raw_text: command.rawText
      };

      // Step 7: Cache the result
      normalizationCache.set(cacheKey, response);

      // Step 8: Log analytics
      const processingTime = Date.now() - startTime;
      const avgConfidence = filteredMatches.reduce((sum, m) => sum + m.match_confidence, 0) / filteredMatches.length;
      
      if (command.userId) {
        await normalizationAnalytics.logNormalization(
          command.userId,
          command.rawText,
          filteredMatches.length,
          avgConfidence,
          processingTime,
          method,
          false // cache miss
        );
      }

      return response;
    } catch (error) {
      // Log failed normalization
      if (command.userId) {
        await normalizationAnalytics.logNormalization(
          command.userId,
          command.rawText,
          0,
          0,
          Date.now() - startTime,
          'deterministic',
          false
        );
      }
      
      throw error;
    }
  }
      const compoundTokens = this.textProcessor.extractCompoundIngredients(ingredientTokens);

      if (compoundTokens.length === 0) {
        throw new NormalizationError(
          'No potential ingredients found in text',
          'NO_INGREDIENTS',
          `Preprocessed text: "${preprocessedText}"`
        );
      }

      // Step 2: Deterministic matching via database lookup
      const deterministicMatches = await this.deterministicMatcher.findMatches(compoundTokens);
      
      // Step 3: Optional LLM fallback for unmatched tokens
      let allMatches = deterministicMatches;
      if (this.llmService?.isEnabled() && deterministicMatches.length < compoundTokens.length) {
        const unmatchedTokens = await this.identifyUnmatchedTokens(
          compoundTokens, 
          deterministicMatches
        );
        
        if (unmatchedTokens.length > 0) {
          const availableIngredients = await this.getAvailableIngredients();
          const llmMatches = await this.llmService.normalizeWithLLM(
            unmatchedTokens,
            availableIngredients
          );
          
          allMatches = [...deterministicMatches, ...this.convertLLMMatches(llmMatches)];
        }
      }

      // Step 4: Filter, deduplicate, and rank results
      const finalMatches = await this.postProcessMatches(allMatches, command);
      
      if (finalMatches.length === 0) {
        throw new NormalizationError(
          'No ingredients could be matched with sufficient confidence',
          'INSUFFICIENT_CONFIDENCE',
          `Minimum confidence: ${command.minConfidence}, tokens: ${compoundTokens.join(', ')}`
        );
      }

      // Step 5: Log performance metrics
      const processingTime = Date.now() - startTime;
      await this.logNormalization(command, finalMatches, processingTime);

      return {
        data: finalMatches,
        raw_text: command.rawText
      };

    } catch (error) {
      if (error instanceof NormalizationError) {
        throw error;
      }
      
      console.error('Unexpected normalization error:', error);
      throw new NormalizationError(
        'Internal normalization service error',
        'INTERNAL_ERROR',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Identifies tokens that weren't successfully matched by deterministic methods
   */
  private async identifyUnmatchedTokens(
    originalTokens: string[],
    matches: any[]
  ): Promise<string[]> {
    const matchedNames = new Set(
      matches.map(match => match.name.toLowerCase())
    );

    return originalTokens.filter(token => {
      const lowerToken = token.toLowerCase();
      
      // Check if token was directly matched
      if (matchedNames.has(lowerToken)) return false;
      
      // Check if token is part of any matched ingredient name
      for (const matchedName of matchedNames) {
        if (matchedName.includes(lowerToken) || lowerToken.includes(matchedName)) {
          return false;
        }
      }
      
      return true;
    });
  }

  /**
   * Converts LLM matches to the standard format
   */
  private convertLLMMatches(llmMatches: any[]): NormalizedIngredientMatch[] {
    return llmMatches.map(match => ({
      ingredient_id: match.ingredient_id,
      name: match.name,
      match_confidence: match.match_confidence,
      match_method: 'fuzzy' as const // Map LLM to fuzzy for API consistency
    }));
  }

  /**
   * Post-processes matches: filtering, deduplication, and ranking
   */
  private async postProcessMatches(
    matches: NormalizedIngredientMatch[],
    command: NormalizationCommand
  ): Promise<NormalizedIngredientMatch[]> {
    // Filter by minimum confidence
    const filteredMatches = matches.filter(
      match => match.match_confidence >= command.minConfidence
    );

    // Deduplicate by ingredient_id (keep highest confidence)
    const deduplicatedMatches = this.deduplicateByIngredientId(filteredMatches);

    // Sort by confidence descending, then by method preference
    const sortedMatches = deduplicatedMatches.sort((a, b) => {
      // Primary sort: confidence descending
      const confidenceDiff = b.match_confidence - a.match_confidence;
      if (Math.abs(confidenceDiff) > 0.01) return confidenceDiff;
      
      // Secondary sort: prefer deterministic over fuzzy
      const aScore = a.match_method === 'deterministic' ? 1 : 0;
      const bScore = b.match_method === 'deterministic' ? 1 : 0;
      return bScore - aScore;
    });

    // Limit results
    return sortedMatches.slice(0, command.maxResults);
  }

  /**
   * Removes duplicate ingredients, keeping the highest confidence match
   */
  private deduplicateByIngredientId(matches: NormalizedIngredientMatch[]): NormalizedIngredientMatch[] {
    const seen = new Map<number, NormalizedIngredientMatch>();
    
    for (const match of matches) {
      const existing = seen.get(match.ingredient_id);
      if (!existing || match.match_confidence > existing.match_confidence) {
        seen.set(match.ingredient_id, match);
      }
    }
    
    return Array.from(seen.values());
  }

  /**
   * Retrieves available ingredient names for LLM context
   */
  private async getAvailableIngredients(): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from('ingredients')
        .select('name')
        .limit(500); // Reasonable limit for LLM context

      if (error) {
        console.warn('Failed to fetch ingredients for LLM context:', error);
        return [];
      }

      return data?.map(ingredient => ingredient.name) || [];
    } catch (error) {
      console.warn('Error fetching ingredients for LLM context:', error);
      return [];
    }
  }

  /**
   * Logs normalization operation for analytics and monitoring
   */
  private async logNormalization(
    command: NormalizationCommand,
    matches: NormalizedIngredientMatch[],
    processingTimeMs: number
  ): Promise<void> {
    try {
      const avgConfidence = matches.length > 0 
        ? matches.reduce((sum, match) => sum + match.match_confidence, 0) / matches.length 
        : 0;

      // Log to console for now - could be extended to proper analytics service
      console.log({
        event: 'ingredient_normalization',
        userId: command.userId,
        rawTextLength: command.rawText.length,
        matchCount: matches.length,
        avgConfidence: Number(avgConfidence.toFixed(3)),
        processingTimeMs,
        deterministic: matches.filter(m => m.match_method === 'deterministic').length,
        fuzzy: matches.filter(m => m.match_method === 'fuzzy').length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Failed to log normalization metrics:', error);
    }
  }

  /**
   * Gets service health and configuration information
   */
  getServiceInfo(): {
    textProcessorReady: boolean;
    deterministicMatcherReady: boolean;
    llmServiceEnabled: boolean;
    llmCacheStats?: any;
  } {
    return {
      textProcessorReady: true,
      deterministicMatcherReady: true,
      llmServiceEnabled: this.llmService?.isEnabled() ?? false,
      llmCacheStats: this.llmService?.getCacheStats()
    };
  }

  /**
   * Clears any internal caches
   */
  clearCaches(): void {
    this.llmService?.clearCache();
  }
    // Search for ingredients that match the clean text
    const searchResults = await this.ingredientRepository.searchIngredients({
      search: cleanText,
      limit: 10
    });

    const matches: NormalizedIngredientMatch[] = [];

    for (const ingredient of searchResults) {
      const ingredientName = ingredient.name.toLowerCase();
      
      // Exact match - highest confidence
      if (ingredientName === cleanText) {
        matches.push({
          ingredient_id: ingredient.id,
          name: ingredient.name,
          match_confidence: 1,
          match_method: "deterministic"
        });
      }
      // Prefix match - high confidence
      else if (ingredientName.startsWith(cleanText) || cleanText.startsWith(ingredientName)) {
        const confidenceRatio = Math.min(cleanText.length, ingredientName.length) / 
                               Math.max(cleanText.length, ingredientName.length);
        matches.push({
          ingredient_id: ingredient.id,
          name: ingredient.name,
          match_confidence: Math.max(0.8, confidenceRatio),
          match_method: "deterministic"
        });
      }
    }

    // Sort by confidence (highest first) and return top matches
    const sortedMatches = matches.toSorted((a, b) => b.match_confidence - a.match_confidence);
    return sortedMatches.slice(0, 3);
  }

  /**
   * Fuzzy matching using string similarity algorithms
   * @param cleanText - Cleaned ingredient text
   * @returns Array of fuzzy matches with confidence scores
   */
  private async fuzzyMatch(cleanText: string): Promise<NormalizedIngredientMatch[]> {
    // Get a broader set of ingredients for fuzzy matching
    const allIngredients = await this.ingredientRepository.searchIngredients({
      limit: 100 // Get more ingredients for fuzzy comparison
    });

    const matches: NormalizedIngredientMatch[] = [];

    for (const ingredient of allIngredients) {
      const similarity = this.calculateSimilarity(cleanText, ingredient.name.toLowerCase());
      
      // Only include matches with reasonable similarity (>0.6)
      if (similarity > 0.6) {
        matches.push({
          ingredient_id: ingredient.id,
          name: ingredient.name,
          match_confidence: Math.min(0.95, similarity), // Cap fuzzy matches at 0.95
          match_method: "fuzzy"
        });
      }
    }

    // Sort by confidence and return top 3 matches
    const sortedMatches = matches.toSorted((a, b) => b.match_confidence - a.match_confidence);
    return sortedMatches.slice(0, 3);
  }

  /**
   * Calculate string similarity using a simple algorithm
   * Combines character overlap and length similarity
   * @param str1 - First string
   * @param str2 - Second string
   * @returns Similarity score between 0 and 1
   */
  private calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    
    const longer = str1.length > str2.length ? str1 : str2;
    
    if (longer.length === 0) return 1;
    
    // Calculate edit distance (simple version)
    const editDistance = this.calculateEditDistance(str1, str2);
    
    // Convert to similarity score
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate edit distance between two strings (Levenshtein distance)
   * @param str1 - First string
   * @param str2 - Second string
   * @returns Edit distance
   */
  private calculateEditDistance(str1: string, str2: string): number {
    const matrix = new Array(str2.length + 1).fill(null).map(() => new Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + cost // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}