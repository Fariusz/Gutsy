import type { APIContext } from "astro";
import { z } from "zod";
import type { LoginRequest, AuthResponse, ErrorResponse } from "../../../types";

export const prerender = false;

const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

/**
 * POST /api/auth/login - Authenticate user login
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
    const validationResult = LoginSchema.safeParse(requestBody);
    if (!validationResult.success) {
      const validationErrors = validationResult.error.errors.map((error) => ({
        field: error.path.join("."),
        message: error.message,
      }));

      return new Response(
        JSON.stringify({
          error: {
            type: "validation_error",
            message: "Login validation failed",
            details: validationErrors,
          },
        } as ErrorResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { email, password } = validationResult.data;

    // 3. Authenticate with Supabase
    const { data, error } = await context.locals.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return new Response(
        JSON.stringify({
          error: {
            type: "authorization_error",
            message: "Invalid email or password",
            details: error,
          },
        } as ErrorResponse),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!data.user || !data.session) {
      return new Response(
        JSON.stringify({
          error: {
            type: "business_logic_error",
            message: "Login failed - session not created",
            details: [],
          },
        } as ErrorResponse),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 4. Return success response
    const authResponse: AuthResponse = {
      user: {
        id: data.user.id,
        email: data.user.email || email,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at || 0,
      },
    };

    return new Response(JSON.stringify({ data: authResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error during login:", error);

    return new Response(
      JSON.stringify({
        error: {
          type: "business_logic_error",
          message: "Login failed",
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
