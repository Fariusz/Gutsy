import type { APIContext } from "astro";

export const prerender = false;

/**
 * POST /api/auth/logout - Log out the current user
 */
export async function POST(context: APIContext): Promise<Response> {
  try {
    console.log("Logout: Starting request");

    // 1. Check if user is authenticated
    const {
      data: { user },
      error: userError,
    } = await context.locals.supabase.auth.getUser();

    if (userError) {
      console.error("Logout user error:", userError);
      return new Response(
        JSON.stringify({
          error: {
            type: "authorization_error",
            message: "Authentication error: " + userError.message,
          },
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!user) {
      console.log("Logout: No user found, but treating as success");
      // If no session, consider it already logged out
      return new Response(
        JSON.stringify({
          data: {
            message: "Already logged out",
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("Logout: Session found for user:", user.id);

    // 2. Sign out with Supabase
    const { error } = await context.locals.supabase.auth.signOut();

    if (error) {
      console.error("Logout: Supabase signOut error:", error);
      return new Response(
        JSON.stringify({
          error: {
            type: "server_error",
            message: "Logout failed: " + error.message,
          },
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("Logout: Successfully signed out");

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
    console.error("Logout API error:", error);
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
