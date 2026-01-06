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
      data: { user },
      error: userError,
    } = await context.locals.supabase.auth.getUser();

    if (userError) {
      console.error("User authentication error:", userError);
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
      console.log("No authenticated user found");
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

    console.log("User authenticated:", user.id);

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
