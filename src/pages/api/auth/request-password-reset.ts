import type { APIContext } from "astro";
import { z } from "zod";
import type { ForgotPasswordRequest, ErrorResponse } from "../../../types";

export const prerender = false;

const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

/**
 * POST /api/auth/request-password-reset - Request password reset email
 */
export async function POST(context: APIContext): Promise<Response> {
  try {
    // 1. Parse and validate request body
    let requestBody: unknown;
    try {
      requestBody = await context.request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: {
            type: "validation_error",
            message: "Invalid JSON in request body",
            details: [],
          },
        } as ErrorResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 2. Validate request schema
    const validationResult = ForgotPasswordSchema.safeParse(requestBody);
    if (!validationResult.success) {
      const validationErrors = validationResult.error.errors.map((error) => ({
        field: error.path.join("."),
        message: error.message,
      }));

      return new Response(
        JSON.stringify({
          error: {
            type: "validation_error",
            message: "Password reset validation failed",
            details: validationErrors,
          },
        } as ErrorResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { email } = validationResult.data;

    // 3. Request password reset with Supabase
    const { error } = await context.locals.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${context.url.origin}/reset-password`,
    });

    if (error) {
      return new Response(
        JSON.stringify({
          error: {
            type: "business_logic_error",
            message: "Password reset request failed",
            details: error,
          },
        } as ErrorResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 4. Return success response (always return success for security)
    return new Response(
      JSON.stringify({
        data: {
          message: "If an account with this email exists, you will receive a password reset link.",
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error during password reset request:", error);

    return new Response(
      JSON.stringify({
        error: {
          type: "business_logic_error",
          message: "Password reset request failed",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      } as ErrorResponse),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
