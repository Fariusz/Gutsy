import type { APIContext } from "astro";
import { z } from "zod";
import type { AuthResponse } from "../../../types";

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
    console.log("Login: Starting request");

    // 1. Parse and validate request body
    let requestBody: unknown;
    try {
      requestBody = await context.request.json();
      console.log("Login: Parsed request body");
    } catch {
      console.error("Login: Failed to parse JSON body");
      return new Response(
        JSON.stringify({
          error: {
            type: "validation_error",
            message: "Invalid JSON in request body",
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 2. Validate request schema
    const validationResult = LoginSchema.safeParse(requestBody);
    if (!validationResult.success) {
      console.error("Login: Body validation failed:", validationResult.error);
      return new Response(
        JSON.stringify({
          error: {
            type: "validation_error",
            message: "Login validation failed",
            details: validationResult.error.errors.map((error) => ({
              field: error.path.join("."),
              message: error.message,
            })),
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { email, password } = validationResult.data;
    console.log("Login: Attempting to authenticate user:", email);

    // 3. Authenticate with Supabase
    const { data, error } = await context.locals.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login: Supabase auth error:", error);
      return new Response(
        JSON.stringify({
          error: {
            type: "authorization_error",
            message: "Invalid email or password",
          },
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!data.user || !data.session) {
      console.error("Login: No user or session in response");
      return new Response(
        JSON.stringify({
          error: {
            type: "server_error",
            message: "Login failed - session not created",
          },
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("Login: Successfully authenticated user:", data.user.id);

    // 4. Persist session on the server (set cookies) so subsequent server-side requests are authenticated.
    //    Use the server-side client to set the session cookies via the provided cookie adapter.
    try {
      const { error: sessionSetError } = await context.locals.supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      if (sessionSetError) {
        console.error("Login: Failed to set server session cookies:", sessionSetError);
      } else {
        console.log("Login: Server session set successfully");
      }
    } catch (setErr) {
      console.error("Login: Exception while setting server session:", setErr);
    }

    // 5. Return success response
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
    console.error("Login API error:", error);
    return new Response(
      JSON.stringify({
        error: {
          type: "server_error",
          message: error instanceof Error ? error.message : "Internal server error",
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
