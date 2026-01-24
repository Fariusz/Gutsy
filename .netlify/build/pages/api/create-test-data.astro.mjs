export { renderers } from '../../renderers.mjs';

const prerender = false;
async function POST(context) {
  try {
    console.log("Create test data: Starting request");
    const {
      data: { user },
      error: authError
    } = await context.locals.supabase.auth.getUser();
    if (authError) {
      console.error("Create test data auth error:", authError);
      return new Response(JSON.stringify({ error: "Authentication failed" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (!user) {
      console.log("Create test data: No user found");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    const userId = user.id;
    console.log("Create test data: User ID:", userId);
    const rpcResult = await context.locals.supabase.rpc("create_test_data_for_user", {
      target_user_id: userId
    });
    const { error } = rpcResult;
    if (error) {
      console.error("Create test data RPC error:", error);
      return new Response(JSON.stringify({ error: "Failed to create test data: " + error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    console.log("Create test data: Success");
    const { count: logsCount } = await context.locals.supabase.from("logs").select("*", { count: "exact", head: true }).eq("user_id", userId);
    const { count: symptomsCount } = await context.locals.supabase.from("log_symptoms").select("*", { count: "exact", head: true });
    return new Response(
      JSON.stringify({
        message: "Test data created successfully!",
        summary: {
          user_id: userId,
          total_logs: logsCount,
          symptoms_relationships: symptomsCount
        },
        next_steps: [
          "Visit /triggers to test the analysis",
          "Use date range: 2026-01-01 to 2026-01-12",
          "Expected triggers: Tomatoes should show high trigger score"
        ]
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Create test data API error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
