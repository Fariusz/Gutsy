import type { APIContext } from "astro";
import { TriggersQuerySchema } from "../../lib/validation/schemas.js";
import type { TriggerAnalysisResponse } from "../../types";

export const prerender = false;

/**
 * GET /api/triggers - Get ranked trigger ingredients for a user within a date range
 */
export async function GET(context: APIContext): Promise<Response> {
  try {
    console.log("Triggers GET: Starting request");

    // 1. Check authentication - use getUser() instead of getSession() for security
    const {
      data: { user },
      error: authError,
    } = await context.locals.supabase.auth.getUser();

    if (authError) {
      console.error("Triggers GET auth error:", authError);
      return new Response(
        JSON.stringify({
          error: {
            type: "authentication_error",
            message: authError.message,
          },
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!user) {
      console.log("Triggers GET: No user found");
      return new Response(
        JSON.stringify({
          error: {
            type: "authentication_error",
            message: "Unauthorized",
          },
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const userId = user.id;
    console.log("Triggers GET: User ID:", userId);

    // 2. Parse and validate query parameters
    const url = new URL(context.request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());

    const result = TriggersQuerySchema.safeParse(queryParams);
    if (!result.success) {
      console.error("Triggers GET validation error:", result.error.errors);
      return new Response(
        JSON.stringify({
          error: {
            type: "validation_error",
            message: "Invalid query parameters",
            details: result.error.errors,
          },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { start_date, end_date, limit } = result.data;
    const detailed = queryParams.detailed === "true";

    // 3. Call the appropriate RPC function
    let triggersData, correlationsData;

    if (detailed) {
      // Get detailed ingredient-symptom correlations
      const { data, error } = await context.locals.supabase.rpc("get_ingredient_symptom_correlations", {
        p_user_id: userId,
        p_start_date: start_date,
        p_end_date: end_date,
        p_limit: limit * 2, // Get more detailed data
      });

      if (error) {
        console.error("Triggers GET detailed analysis error:", error);
        return new Response(
          JSON.stringify({
            error: {
              type: "database_error",
              message: "Failed to analyze detailed triggers",
            },
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      correlationsData = data || [];
    }

    // Always get the simplified triggers for backward compatibility
    console.log("Triggers GET: Calling get_top_triggers with params:", {
      p_user_id: userId,
      p_start_date: start_date,
      p_end_date: end_date,
      p_limit: limit,
    });

    // Call the main RPC function
    const { data: simplifiedData, error: triggersError } = await context.locals.supabase.rpc("get_top_triggers", {
      p_user_id: userId,
      p_start_date: start_date,
      p_end_date: end_date,
      p_limit: limit,
    });

    console.log("Triggers GET: RPC response:", { data: simplifiedData, error: triggersError });

    if (triggersError) {
      console.error("Triggers GET RPC error:", triggersError);
      return new Response(
        JSON.stringify({
          error: {
            type: "database_error",
            message: "Failed to analyze triggers",
          },
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    triggersData = simplifiedData || [];

    // 4. Get total logs count in the period for context
    console.log("Triggers GET: Counting logs with query:", {
      user_id: userId,
      start_date: start_date,
      end_date: end_date,
    });

    const { count: totalLogs, error: countError } = await context.locals.supabase
      .from("logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("log_date", start_date)
      .lte("log_date", end_date);

    console.log("Triggers GET: Logs count result:", { count: totalLogs, error: countError });

    if (countError) {
      console.error("Triggers GET count error:", countError);
      // Continue without count - not critical
    }

    // 5. Build response
    const response: TriggerAnalysisResponse = {
      triggers: triggersData,
      ...(correlationsData && { correlations: correlationsData }),
      analysis_period: {
        start_date,
        end_date,
        total_logs: totalLogs || 0,
      },
    };

    console.log(
      `Triggers GET: Returning ${response.triggers.length} triggers` +
        (response.correlations ? ` and ${response.correlations.length} correlations` : "")
    );

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Triggers GET unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: {
          type: "server_error",
          message: "An unexpected error occurred.",
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
