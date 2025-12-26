import type { APIContext } from "astro";
import type { ErrorResponse } from "../../../types";

export const prerender = false;

/**
 * POST /api/auth/logout - Log out the current user
 */
export async function POST(context: APIContext): Promise<Response> {
  try {
    // 1. Check if user is authenticated
    const {
      data: { session },
      error: sessionError,
    } = await context.locals.supabase.auth.getSession();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({
          error: {
            type: "authorization_error",
            message: "No active session to logout",
          },
        } as ErrorResponse),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 2. Sign out with Supabase
    const { error } = await context.locals.supabase.auth.signOut();

    if (error) {
      return new Response(
        JSON.stringify({
          error: {
            type: "business_logic_error",
            message: "Logout failed",
            details: error,
          },
        } as ErrorResponse),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 3. Return success response
    return new Response(
      JSON.stringify({
        data: {
          message: "Successfully logged out",
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error during logout:", error);

    return new Response(
      JSON.stringify({
        error: {
          type: "business_logic_error",
          message: "Logout failed",
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
