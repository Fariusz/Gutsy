import { ZodError } from "zod";
import { AuthenticationError } from "../auth/auth-helpers";
import type { ErrorResponse, ValidationErrorDetail } from "../../types";

/**
 * Standardized error handling utilities for API endpoints
 * Maps different error types to appropriate HTTP responses
 */

/**
 * Business logic error for trigger analysis failures
 */
export class BusinessLogicError extends Error {
  constructor(
    message: string,
    public details: string,
    public statusCode = 422
  ) {
    super(message);
    this.name = "BusinessLogicError";
  }
}

/**
 * Error thrown when insufficient data exists for analysis
 */
export class InsufficientDataError extends BusinessLogicError {
  constructor(details: string) {
    super("Insufficient data for trigger analysis", details);
  }
}

/**
 * Rate limiting error class
 */
export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

/**
 * Handle API errors and return appropriate Response objects
 * Centralizes error handling logic across all endpoints
 */
export function handleApiError(error: unknown, customMessage?: string): Response {
  console.error("API Error:", error);

  // Validation errors (Zod)
  if (error instanceof ZodError) {
    return createValidationErrorResponse(error);
  }

  // Authentication errors
  if (error instanceof AuthenticationError) {
    return createAuthErrorResponse(error.message);
  }

  // Business logic errors (custom)
  if (error instanceof BusinessLogicError) {
    return createBusinessLogicErrorResponse(error.message, error.details);
  }

  // Rate limiting errors
  if (error instanceof RateLimitError) {
    return createRateLimitErrorResponse(error.message);
  }

  // Generic server errors
  return createServerErrorResponse(customMessage);
}

/**
 * Create validation error response (400)
 */
function createValidationErrorResponse(zodError: ZodError): Response {
  const details: ValidationErrorDetail[] = zodError.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));

  const errorResponse: ErrorResponse = {
    error: {
      type: "validation_error",
      message: "Invalid request parameters",
      details,
    },
  };

  return new Response(JSON.stringify(errorResponse), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Create authentication error response (401)
 */
function createAuthErrorResponse(message: string): Response {
  const errorResponse: ErrorResponse = {
    error: {
      type: "authorization_error",
      message,
    },
  };

  return new Response(JSON.stringify(errorResponse), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Create business logic error response (400)
 */
function createBusinessLogicErrorResponse(message: string, details: string): Response {
  const errorResponse: ErrorResponse = {
    error: {
      type: "business_logic_error",
      message,
      details,
    },
  };

  return new Response(JSON.stringify(errorResponse), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Create rate limit error response (429)
 */
function createRateLimitErrorResponse(message: string): Response {
  const errorResponse = {
    error: {
      type: "rate_limit_error" as const,
      message,
    },
  };

  return new Response(JSON.stringify(errorResponse), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": "60", // Suggest retry after 60 seconds
    },
  });
}

/**
 * Create generic server error response (500)
 */
function createServerErrorResponse(customMessage?: string): Response {
  const errorResponse = {
    error: {
      type: "server_error" as const,
      message: customMessage || "An unexpected error occurred. Please try again later.",
    },
  };

  return new Response(JSON.stringify(errorResponse), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Create not found error response (404)
 */
export function createNotFoundErrorResponse(resource: string): Response {
  const errorResponse = {
    error: {
      type: "not_found_error" as const,
      message: `${resource} not found`,
    },
  };

  return new Response(JSON.stringify(errorResponse), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Create successful JSON response with proper headers
 */
export function createSuccessResponse<T>(
  data: T,
  options?: {
    status?: number;
    cacheControl?: string;
  }
): Response {
  const { status = 200, cacheControl } = options || {};

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (cacheControl) {
    headers["Cache-Control"] = cacheControl;
  }

  return new Response(JSON.stringify(data), {
    status,
    headers,
  });
}
