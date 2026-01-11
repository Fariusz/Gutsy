import type { APIContext } from "astro";
import type { ErrorResponse } from "../../../types";

export const prerender = false;

/**
 * POST /api/auth/social - Initiate social authentication
 */
export async function POST(context: APIContext): Promise<Response> {
  try {
    const { provider } = await context.request.json();

    if (provider !== "google") {
      return new Response(
        JSON.stringify({
          error: {
            type: "validation_error",
            message: "Unsupported provider. Only 'google' is supported.",
          },
        } as ErrorResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 1. Sign in with Google
    const { data, error } = await context.locals.supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${context.url.origin}/logs`,
      },
    });

    if (error) {
      return new Response(
        JSON.stringify({
          error: {
            type: "business_logic_error",
            message: "Social authentication failed",
            details: error,
          },
        } as ErrorResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 2. Return the OAuth URL for redirect
    return new Response(
      JSON.stringify({
        data: {
          url: data.url,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error during social authentication:", error);

    return new Response(
      JSON.stringify({
        error: {
          type: "business_logic_error",
          message: "Social authentication failed",
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
