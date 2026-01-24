import type { APIContext } from "astro";
import { logger } from "../../../lib/utils/logger";

export const prerender = false;

/**
 * GET /api/auth/status - Get current authentication status and debug info
 */
export async function GET(context: APIContext): Promise<Response> {
  try {
    logger.info("Auth Status: Starting request");

    const {
      data: { user },
      error: userError,
    } = await context.locals.supabase.auth.getUser();

    if (userError) {
      logger.error("Auth Status: User error:", { error: userError });
      return new Response(
        JSON.stringify({
          authenticated: false,
          error: userError.message,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!user) {
      logger.info("Auth Status: No active user");
      return new Response(
        JSON.stringify({
          authenticated: false,
          message: "No active user",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    logger.info("Auth Status: User authenticated:", { userId: user.id });

    // Check if user exists in auth.users by trying to query their profile
    const { error: userCheckError } = await context.locals.supabase.rpc("get_user_exists", { user_id: user.id }).single();

    return new Response(
      JSON.stringify({
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          email_confirmed_at: user.email_confirmed_at,
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
        },
        userExistsInAuth: userCheckError ? false : true,
        userCheckError: userCheckError?.message,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    logger.error("Auth Status API error:", { error });
    return new Response(
      JSON.stringify({
        authenticated: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
