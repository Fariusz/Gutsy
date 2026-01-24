export { renderers } from '../../../renderers.mjs';

const prerender = false;
async function POST(context) {
  try {
    console.log("Logout: Starting request");
    const {
      data: { user },
      error: userError
    } = await context.locals.supabase.auth.getUser();
    if (userError) {
      console.error("Logout user error:", userError);
      return new Response(
        JSON.stringify({
          error: {
            type: "authorization_error",
            message: "Authentication error: " + userError.message
          }
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    if (!user) {
      console.log("Logout: No user found, but treating as success");
      return new Response(
        JSON.stringify({
          data: {
            message: "Already logged out"
          }
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    console.log("Logout: Session found for user:", user.id);
    const { error } = await context.locals.supabase.auth.signOut();
    if (error) {
      console.error("Logout: Supabase signOut error:", error);
      return new Response(
        JSON.stringify({
          error: {
            type: "server_error",
            message: "Logout failed: " + error.message
          }
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    console.log("Logout: Successfully signed out");
    return new Response(
      JSON.stringify({
        data: {
          message: "Successfully logged out"
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Logout API error:", error);
    return new Response(
      JSON.stringify({
        error: {
          type: "server_error",
          message: error instanceof Error ? error.message : "Internal server error"
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
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
