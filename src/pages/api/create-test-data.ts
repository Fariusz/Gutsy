import type { APIContext } from "astro";
import { logger } from "../../lib/utils/logger";

export const prerender = false;

/**
 * POST /api/create-test-data - Create test data for trigger analysis
 */
export async function POST(context: APIContext): Promise<Response> {
  try {
    logger.info("Create test data: Starting request");

    // 1. Check authentication
    const {
      data: { user },
      error: authError,
    } = await context.locals.supabase.auth.getUser();

    if (authError) {
      logger.error("Create test data auth error:", { error: authError });
      return new Response(JSON.stringify({ error: "Authentication failed" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!user) {
      logger.info("Create test data: No user found");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    logger.info("Create test data: User ID:", { userId });

    // 2. Call the function to create test data for this user
    const rpcResult = await context.locals.supabase.rpc("create_test_data_for_user", {
      target_user_id: userId,
    });
    const { error } = rpcResult;

    if (error) {
      logger.error("Create test data RPC error:", { error });
      return new Response(JSON.stringify({ error: "Failed to create test data: " + error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    logger.info("Create test data: Success");

    // 3. Return summary of created data
    const { count: logsCount } = await context.locals.supabase
      .from("logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    // For simplicity, just count logs and related data
    const { count: symptomsCount } = await context.locals.supabase.from("log_symptoms").select("*", { count: "exact", head: true });

    return new Response(
      JSON.stringify({
        message: "Test data created successfully!",
        summary: {
          user_id: userId,
          total_logs: logsCount,
          symptoms_relationships: symptomsCount,
        },
        next_steps: [
          "Visit /triggers to test the analysis",
          "Use date range: 2026-01-01 to 2026-01-12",
          "Expected triggers: Tomatoes should show high trigger score",
        ],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    logger.error("Create test data API error:", { error });
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
