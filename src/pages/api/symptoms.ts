import type { APIContext } from "astro";
import { SymptomService } from "../../lib/services/symptom-service";

export const prerender = false;

/**
 * API endpoint to get all symptoms
 * @returns SymptomsResponse with all available symptoms
 */
export async function GET(context: APIContext): Promise<Response> {
  try {
    // 1. Check authentication
    console.log("Symptoms API: Starting request");

    const {
      data: { session },
      error: sessionError,
    } = await context.locals.supabase.auth.getSession();

    if (sessionError) {
      console.error("Session error:", sessionError);
      return new Response(
        JSON.stringify({
          error: {
            type: "authorization_error",
            message: "Session error: " + sessionError.message,
          },
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!session?.user) {
      console.log("No session found");
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

    console.log("Session validated for user:", session.user.id);

    // 2. Get symptoms
    const symptomService = new SymptomService(context.locals.supabase);
    const response = await symptomService.getAllSymptoms();

    console.log("Service response:", {
      hasData: !!response.data,
      dataLength: response.data?.length,
      hasError: !!response.error,
    });

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Symptoms API error:", error);
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
