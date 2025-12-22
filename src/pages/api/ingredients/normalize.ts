import type { APIContext } from "astro";
import { ZodError } from "zod";

import { NormalizeIngredientSchema } from "../../lib/validation/normalization-schemas";
import {
  IngredientNormalizationService,
  NormalizationError,
} from "../../lib/services/ingredient-normalization-service";
import { handleApiError } from "../../lib/utils/error-handlers";
import type { NormalizeIngredientResponse, ErrorResponse } from "../../types";

// Disable pre-rendering for this API endpoint
export const prerender = false;

/**
 * Simple rate limiting implementation
 * In production, use Redis or a proper rate limiting service
 */
class SimpleRateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>();

  checkLimit(userId: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(userId);

    if (!userRequests || now > userRequests.resetTime) {
      this.requests.set(userId, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (userRequests.count >= maxRequests) {
      return false;
    }

    userRequests.count++;
    return true;
  }
}

const rateLimiter = new SimpleRateLimiter();

/**
 * Validates authentication and extracts user ID from session
 */
async function validateAuthToken(context: APIContext): Promise<string> {
  const {
    data: { session },
    error,
  } = await context.locals.supabase.auth.getSession();

  if (error || !session?.user) {
    throw new Error("Authentication required");
  }

  return session.user.id;
}

/**
 * POST /api/ingredients/normalize
 *
 * Normalizes raw ingredient text into standardized ingredient matches
 * with confidence scores and match methods.
 */
export async function POST(context: APIContext): Promise<Response> {
  try {
    // Step 1: Authentication
    const userId = await validateAuthToken(context);

    // Step 2: Rate limiting
    if (!rateLimiter.checkLimit(userId, 50, 60000)) {
      // 50 requests per minute
      return new Response(
        JSON.stringify({
          error: {
            type: "rate_limit_error",
            message: "Rate limit exceeded. Please try again later.",
          },
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 3: Input validation
    const body = await context.request.json();
    const validatedData = NormalizeIngredientSchema.parse(body);

    // Step 4: Initialize normalization service
    const normalizationService = new IngredientNormalizationService(context.locals.supabase, {
      enableLLM: import.meta.env.ENABLE_LLM_NORMALIZATION === "true",
      llmApiKey: import.meta.env.LLM_API_KEY,
      llmApiUrl: import.meta.env.LLM_API_URL,
    });

    // Step 5: Perform normalization
    const result = await normalizationService.normalizeIngredients(validatedData.raw_text, {
      userId,
      minConfidence: 0.5,
      maxResults: 10,
    });

    // Step 6: Return success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=300", // Cache for 5 minutes
      },
    });
  } catch (error) {
    // Handle specific error types
    if (error instanceof ZodError) {
      return new Response(
        JSON.stringify({
          error: {
            type: "validation_error",
            message: "Invalid input data",
            details: error.errors.map((err) => ({
              field: err.path.join("."),
              message: err.message,
            })),
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (error instanceof NormalizationError) {
      const statusCode =
        error.code === "NO_INGREDIENTS" || error.code === "EMPTY_INPUT"
          ? 400
          : error.code === "INSUFFICIENT_CONFIDENCE"
            ? 422
            : 500;

      return new Response(
        JSON.stringify({
          error: {
            type: "business_logic_error",
            message: error.message,
            details: error.details || error.code,
          },
        }),
        {
          status: statusCode,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (error instanceof Error && error.message.includes("Authentication")) {
      return new Response(
        JSON.stringify({
          error: {
            type: "authorization_error",
            message: "Authentication required",
          },
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Generic server error
    console.error("Unexpected error in normalization endpoint:", error);
    return new Response(
      JSON.stringify({
        error: {
          type: "internal_server_error",
          message: "Internal server error occurred",
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
