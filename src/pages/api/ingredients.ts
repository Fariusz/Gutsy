import type { APIContext } from "astro";
import { IngredientsQuerySchema } from "../lib/validation/ingredient-schemas";
import { IngredientService } from "../lib/services/ingredient-service";
import { IngredientCache } from "../lib/cache/ingredient-cache";
import { validateAuthToken } from "../lib/auth/auth-helpers";
import { handleApiError, createSuccessResponse } from "../lib/utils/error-handlers";

// Disable prerendering for this API route
export const prerender = false;

// Shared cache instance for all requests
const ingredientCache = new IngredientCache();

/**
 * GET /api/ingredients
 *
 * Search and retrieve ingredients from the canonical ingredient database.
 * Supports optional search filtering and result limiting.
 *
 * Query Parameters:
 * - search?: string (1-100 chars) - Filter ingredients by name prefix
 * - limit?: number (1-500, default 100) - Maximum results to return
 *
 * Authentication: Required (Bearer token)
 *
 * Responses:
 * - 200: Success with ingredient list
 * - 400: Invalid query parameters
 * - 401: Authentication required
 * - 500: Server error
 */
export async function GET(context: APIContext): Promise<Response> {
  try {
    // Step 1: Validate authentication
    await validateAuthToken(context);

    // Step 2: Parse and validate query parameters
    const url = new URL(context.request.url);
    const rawParams = Object.fromEntries(url.searchParams);

    // Transform empty strings to undefined for optional parameters
    const cleanParams = Object.fromEntries(Object.entries(rawParams).filter(([_, value]) => value !== ""));

    const queryParams = IngredientsQuerySchema.parse(cleanParams);

    // Step 3: Initialize ingredient service with Supabase client
    const ingredientService = new IngredientService(context.locals.supabase, ingredientCache);

    // Step 4: Search ingredients using the service
    const result = await ingredientService.searchIngredients({
      search: queryParams.search,
      limit: queryParams.limit,
    });

    // Step 5: Return successful response with caching headers
    return createSuccessResponse(result, {
      cacheControl: "public, max-age=300", // Cache for 5 minutes
    });
  } catch (error) {
    // Step 6: Handle all errors consistently
    return handleApiError(error);
  }
}
