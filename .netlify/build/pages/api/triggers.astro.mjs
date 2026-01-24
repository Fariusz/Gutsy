import { T as TriggersQuerySchema } from '../../chunks/schemas_DPM-KRni.mjs';
export { renderers } from '../../renderers.mjs';

const prerender = false;
async function GET(context) {
  try {
    console.log("Triggers GET: Starting request");
    const {
      data: { user },
      error: authError
    } = await context.locals.supabase.auth.getUser();
    if (authError) {
      console.error("Triggers GET auth error:", authError);
      return new Response(
        JSON.stringify({
          error: {
            type: "authentication_error",
            message: authError.message
          }
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    if (!user) {
      console.log("Triggers GET: No user found");
      return new Response(
        JSON.stringify({
          error: {
            type: "authentication_error",
            message: "Unauthorized"
          }
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const userId = user.id;
    console.log("Triggers GET: User ID:", userId);
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
            details: result.error.errors
          }
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const { start_date, end_date, limit } = result.data;
    const detailed = queryParams.detailed === "true";
    let triggersData = [];
    let correlationsData = [];
    if (detailed) {
      const { data, error } = await context.locals.supabase.rpc("get_ingredient_symptom_correlations", {
        p_user_id: userId,
        p_start_date: start_date,
        p_end_date: end_date,
        p_limit: limit * 2
        // Get more detailed data
      });
      if (error) {
        console.error("Triggers GET detailed analysis error:", error);
        return new Response(
          JSON.stringify({
            error: {
              type: "database_error",
              message: "Failed to analyze detailed triggers"
            }
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
      correlationsData = data || [];
    }
    console.log("Triggers GET: Calling get_top_triggers with params:", {
      p_user_id: userId,
      p_start_date: start_date,
      p_end_date: end_date,
      p_limit: limit
    });
    const { data: simplifiedData, error: triggersError } = await context.locals.supabase.rpc("get_top_triggers", {
      p_user_id: userId,
      p_start_date: start_date,
      p_end_date: end_date,
      p_limit: limit
    });
    console.log("Triggers GET: RPC response:", { data: simplifiedData, error: triggersError });
    if (triggersError) {
      console.error("Triggers GET RPC error:", triggersError);
      return new Response(
        JSON.stringify({
          error: {
            type: "database_error",
            message: "Failed to analyze triggers"
          }
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    triggersData = simplifiedData || [];
    console.log("Triggers GET: Counting logs with query:", {
      user_id: userId,
      start_date,
      end_date
    });
    const { count: totalLogs, error: countError } = await context.locals.supabase.from("logs").select("*", { count: "exact", head: true }).eq("user_id", userId).gte("log_date", start_date).lte("log_date", end_date);
    console.log("Triggers GET: Logs count result:", { count: totalLogs, error: countError });
    if (countError) {
      console.error("Triggers GET count error:", countError);
    }
    const response = {
      triggers: triggersData,
      ...correlationsData && { correlations: correlationsData },
      analysis_period: {
        start_date,
        end_date,
        total_logs: totalLogs || 0
      }
    };
    console.log(
      `Triggers GET: Returning ${response.triggers.length} triggers` + (response.correlations ? ` and ${response.correlations.length} correlations` : "")
    );
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Triggers GET unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: {
          type: "server_error",
          message: "An unexpected error occurred."
        }
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
