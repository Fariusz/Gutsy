export { renderers } from '../../renderers.mjs';

const prerender = false;
async function GET(context) {
  try {
    console.log("Debug logs: Starting request");
    const {
      data: { user },
      error: authError
    } = await context.locals.supabase.auth.getUser();
    if (authError) {
      console.error("Debug logs auth error:", authError);
      return new Response(JSON.stringify({ error: "Authentication failed" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (!user) {
      console.log("Debug logs: No user found");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    const userId = user.id;
    console.log("Debug logs: User ID:", userId);
    const { data: allLogs, error: logsError } = await context.locals.supabase.from("logs").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (logsError) {
      console.error("Debug logs error:", logsError);
      return new Response(JSON.stringify({ error: "Failed to fetch logs" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    const { count: totalLogsCount, error: countError } = await context.locals.supabase.from("logs").select("*", { count: "exact", head: true }).eq("user_id", userId);
    const { data: logsWithIngredients, error: ingredientsError } = await context.locals.supabase.from("logs").select(
      `
        id, 
        log_date, 
        user_id,
        log_ingredients (
          ingredient_id,
          ingredients (name)
        )
      `
    ).eq("user_id", userId).limit(5);
    const { data: logsWithSymptoms, error: symptomsError } = await context.locals.supabase.from("logs").select(
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
    ).eq("user_id", userId).limit(5);
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
          symptoms: symptomsError
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Debug logs API error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
