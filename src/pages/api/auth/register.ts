import type { APIContext } from "astro";
import { z } from "zod";
import type { AuthResponse, ErrorResponse } from "../../../types";

export const prerender = false;

// Strong password validation schema based on NIST guidelines
const RegisterSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/\d/, "Password must contain at least one number")
      .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/**
 * POST /api/auth/register - Register a new user
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
    const validationResult = RegisterSchema.safeParse(requestBody);
    if (!validationResult.success) {
      const validationErrors = validationResult.error.errors.map((error) => ({
        field: error.path.join("."),
        message: error.message,
      }));

      return new Response(
        JSON.stringify({
          error: {
            type: "validation_error",
            message: "Registration validation failed",
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

    // 3. Register user with Supabase
    const { data, error } = await context.locals.supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${context.url.origin}/logs`,
      },
    });

    if (error) {
      return new Response(
        JSON.stringify({
          error: {
            type: "business_logic_error",
            message: error.message,
            details: error,
          },
        } as ErrorResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!data.user) {
      return new Response(
        JSON.stringify({
          error: {
            type: "business_logic_error",
            message: "Registration failed - user not created",
            details: [],
          },
        } as ErrorResponse),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 4. Persist session on the server (set cookies) if session returned
    if (data.session) {
      try {
        const { error: sessionSetError } = await context.locals.supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        if (sessionSetError) {
          console.error("Register: Failed to set server session cookies:", sessionSetError);
        } else {
          console.log("Register: Server session set successfully");
        }
      } catch (setErr) {
        console.error("Register: Exception while setting server session:", setErr);
      }
    }

    // 5. Return success response
    const authResponse: AuthResponse = {
      user: {
        id: data.user.id,
        email: data.user.email || email,
      },
      session: data.session
        ? {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at || 0,
          }
        : {
            access_token: "",
            refresh_token: "",
            expires_at: 0,
          },
    };

    return new Response(JSON.stringify({ data: authResponse }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error during registration:", error);

    return new Response(
      JSON.stringify({
        error: {
          type: "business_logic_error",
          message: "Registration failed",
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
