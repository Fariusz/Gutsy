export { renderers } from '../../../renderers.mjs';

const prerender = false;
async function GET(context) {
  try {
    console.log("Auth Status: Starting request");
    const {
      data: { user },
      error: userError
    } = await context.locals.supabase.auth.getUser();
    if (userError) {
      console.error("Auth Status: User error:", userError);
      return new Response(
        JSON.stringify({
          authenticated: false,
          error: userError.message
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    if (!user) {
      console.log("Auth Status: No active user");
      return new Response(
        JSON.stringify({
          authenticated: false,
          message: "No active user"
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    console.log("Auth Status: User authenticated:", user.id);
    const { error: userCheckError } = await context.locals.supabase.rpc("get_user_exists", { user_id: user.id }).single();
    return new Response(
      JSON.stringify({
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          email_confirmed_at: user.email_confirmed_at,
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at
        },
        userExistsInAuth: userCheckError ? false : true,
        userCheckError: userCheckError?.message
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Auth Status API error:", error);
    return new Response(
      JSON.stringify({
        authenticated: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
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
