import type { APIContext } from "astro";
import { logger } from "../../lib/utils/logger";

export const prerender = false;

/**
 * GET /api/debug-logs - Debug endpoint to check logs data
 */
export async function GET(context: APIContext): Promise<Response> {
  try {
    logger.info("Debug logs: Starting request");

    // 1. Check authentication
    const {
      data: { user },
      error: authError,
    } = await context.locals.supabase.auth.getUser();

    if (authError) {
      logger.error("Debug logs auth error:", { error: authError });
      return new Response(JSON.stringify({ error: "Authentication failed" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!user) {
      logger.info("Debug logs: No user found");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    logger.info("Debug logs: User ID:", { userId });

    // Get all logs for this user
    const { data: allLogs, error: logsError } = await context.locals.supabase
      .from("logs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (logsError) {
      logger.error("Debug logs error:", { error: logsError });
      return new Response(JSON.stringify({ error: "Failed to fetch logs" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get total count of all logs
    const { count: totalLogsCount, error: countError } = await context.locals.supabase
      .from("logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    // Get logs with ingredients
    const { data: logsWithIngredients, error: ingredientsError } = await context.locals.supabase
      .from("logs")
      .select(
        `
        id, 
        log_date, 
        user_id,
        log_ingredients (
          ingredient_id,
          ingredients (name)
        )
      `
      )
      .eq("user_id", userId)
      .limit(5);

    // Get logs with symptoms
    const { data: logsWithSymptoms, error: symptomsError } = await context.locals.supabase
      .from("logs")
      .select(
        `
        id, 
        log_date, 
        user_id,
        log_symptoms (
          symptom_id,
          severity,
          symptoms (name)
        )
      `
      )
      .eq("user_id", userId)
      .limit(5);

    return new Response(
      JSON.stringify({
        user_id: userId,
        total_logs: totalLogsCount,
        all_logs: allLogs,
        logs_with_ingredients: logsWithIngredients,
        logs_with_symptoms: logsWithSymptoms,
        errors: {
          logs: logsError,
          count: countError,
          ingredients: ingredientsError,
          symptoms: symptomsError,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    logger.error("Debug logs API error:", { error });
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
