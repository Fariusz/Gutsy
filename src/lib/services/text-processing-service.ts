/**
 * Text Processing Service for Ingredient Normalization
 *
 * Handles tokenization, stop word removal, and ingredient text preprocessing
 * to prepare raw text for database matching operations.
 */
export class TextProcessingService {
  // Common stop words that don't indicate ingredients
  private readonly stopWords = new Set([
    "with",
    "and",
    "in",
    "on",
    "the",
    "a",
    "an",
    "or",
    "of",
    "for",
    "from",
    "to",
    "at",
    "by",
    "is",
    "was",
    "are",
    "were",
    "be",
    "been",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
    "may",
    "might",
    "can",
    "some",
    "any",
    "all",
    "no",
    "not",
    "also",
    "very",
    "so",
    "just",
    "only",
    "but",
    "then",
    "than",
    "as",
    "if",
    "when",
    "where",
    "how",
    "what",
    "who",
    "which",
    "why",
    "this",
    "that",
    "these",
    "those",
    "it",
    "its",
    "they",
    "them",
    "their",
    "we",
    "us",
    "our",
    "you",
    "your",
    "my",
    "me",
    "mine",
    "his",
    "her",
    "him",
  ]);

  // Cooking modifiers and descriptors that don't identify specific ingredients
  private readonly modifiers = new Set([
    "spicy",
    "hot",
    "cold",
    "warm",
    "fresh",
    "dried",
    "frozen",
    "raw",
    "cooked",
    "grilled",
    "fried",
    "baked",
    "roasted",
    "steamed",
    "boiled",
    "sauteed",
    "crispy",
    "crunchy",
    "soft",
    "tender",
    "juicy",
    "sweet",
    "sour",
    "salty",
    "bitter",
    "mild",
    "strong",
    "light",
    "heavy",
    "thick",
    "thin",
    "creamy",
    "chunky",
    "smooth",
    "rough",
    "fine",
    "large",
    "small",
    "big",
    "little",
    "tiny",
    "huge",
    "organic",
    "natural",
    "artificial",
    "homemade",
    "store",
    "bought",
    "canned",
    "bottled",
    "packaged",
    "processed",
    "whole",
    "sliced",
    "diced",
    "chopped",
    "minced",
    "grated",
    "shredded",
    "mashed",
    "crushed",
    "ground",
    "powdered",
    "liquid",
    "solid",
    "extra",
    "added",
    "mixed",
    "pure",
  ]);

  // Quantity indicators that don't represent ingredients
  private readonly quantityWords = new Set([
    "cup",
    "cups",
    "tablespoon",
    "tablespoons",
    "tbsp",
    "teaspoon",
    "teaspoons",
    "tsp",
    "ounce",
    "ounces",
    "oz",
    "pound",
    "pounds",
    "lb",
    "lbs",
    "gram",
    "grams",
    "g",
    "kilogram",
    "kilograms",
    "kg",
    "liter",
    "liters",
    "l",
    "milliliter",
    "milliliters",
    "ml",
    "gallon",
    "gallons",
    "quart",
    "quarts",
    "pint",
    "pints",
    "handful",
    "pinch",
    "pinches",
    "dash",
    "dashes",
    "splash",
    "drops",
    "pieces",
    "slice",
    "slices",
    "clove",
    "cloves",
    "bunch",
    "bunches",
    "head",
    "heads",
    "can",
    "cans",
    "jar",
    "jars",
    "bottle",
    "bottles",
    "package",
    "packages",
    "box",
    "boxes",
  ]);

  /**
   * Tokenizes raw ingredient text into potential ingredient tokens
   * Removes punctuation, splits on whitespace, and filters out non-ingredient words
   */
  tokenize(text: string): string[] {
    if (!text || typeof text !== "string") {
      return [];
    }

    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, " ") // Remove punctuation except hyphens (for compound ingredients)
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim()
      .split(/\s+/)
      .filter((token) => this.isValidToken(token))
      .filter((token) => !this.stopWords.has(token))
      .filter((token) => !this.modifiers.has(token))
      .filter((token) => !this.quantityWords.has(token));
  }

  /**
   * Extracts potential ingredient tokens by applying heuristics
   * to identify words that likely represent actual ingredients
   */
  extractPotentialIngredients(tokens: string[]): string[] {
    return tokens.filter((token) => {
      // Skip very short words (likely not ingredients)
      if (token.length < 2) return false;

      // Skip pure numbers
      if (/^\d+$/.test(token)) return false;

      // Skip number-letter combinations (e.g., "2lb", "3oz")
      if (/^\d+[a-z]+$/.test(token)) return false;

      // Skip single letters
      if (/^[a-z]$/.test(token)) return false;

      // Include everything else as potential ingredients
      return true;
    });
  }

  /**
   * Preprocesses text to clean and normalize it before tokenization
   */
  preprocessText(text: string): string {
    if (!text || typeof text !== "string") {
      return "";
    }

    return text
      .trim()
      .replace(/\s+/g, " ") // Normalize whitespace
      .replace(/[""'']/g, "") // Remove smart quotes
      .replace(/&amp;/g, "and") // Decode HTML entities
      .replace(/&/g, "and") // Convert ampersand to 'and'
      .toLowerCase();
  }

  /**
   * Validates if a token is potentially valid (not empty, not just special characters)
   */
  private isValidToken(token: string): boolean {
    if (!token || token.length === 0) return false;

    // Must contain at least one letter
    if (!/[a-zA-Z]/.test(token)) return false;

    // Skip tokens that are only special characters
    if (/^[^a-zA-Z0-9]+$/.test(token)) return false;

    return true;
  }

  /**
   * Combines adjacent tokens that might form compound ingredient names
   * For example: "tomato sauce" should be treated as a single ingredient
   */
  extractCompoundIngredients(tokens: string[]): string[] {
    const compounds: string[] = [];
    const used = new Set<number>();

    // Look for common compound patterns
    for (let i = 0; i < tokens.length - 1; i++) {
      if (used.has(i)) continue;

      const current = tokens[i];
      const next = tokens[i + 1];

      // Check for common compound ingredient patterns
      if (this.isCompoundIngredient(current, next)) {
        compounds.push(`${current} ${next}`);
        used.add(i);
        used.add(i + 1);
      } else if (!used.has(i)) {
        compounds.push(current);
        used.add(i);
      }
    }

    // Add the last token if not used in a compound
    if (tokens.length > 0 && !used.has(tokens.length - 1)) {
      compounds.push(tokens[tokens.length - 1]);
    }

    return compounds;
  }

  /**
   * Checks if two tokens likely form a compound ingredient
   */
  private isCompoundIngredient(first: string, second: string): boolean {
    const compoundPatterns = [
      // Sauce combinations
      (f: string, s: string) => f === "tomato" && s === "sauce",
      (f: string, s: string) => f === "soy" && s === "sauce",
      (f: string, s: string) => f === "hot" && s === "sauce",

      // Oil combinations
      (f: string, s: string) => f === "olive" && s === "oil",
      (f: string, s: string) => f === "vegetable" && s === "oil",
      (f: string, s: string) => f === "coconut" && s === "oil",

      // Cheese combinations
      (f: string, s: string) => s === "cheese",

      // Meat combinations
      (f: string, s: string) => f === "ground" && ["beef", "turkey", "chicken", "pork"].includes(s),

      // Spice combinations
      (f: string, s: string) => f === "black" && s === "pepper",
      (f: string, s: string) => f === "garlic" && s === "powder",

      // Generic pattern: adjective + noun
      (f: string, s: string) => f.length > 3 && s.length > 3,
    ];

    return compoundPatterns.some((pattern) => pattern(first, second));
  }
}
