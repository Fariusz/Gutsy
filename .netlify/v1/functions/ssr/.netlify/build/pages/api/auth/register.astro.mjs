import { z } from 'zod';
export { renderers } from '../../../renderers.mjs';

const prerender = false;
const RegisterSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").regex(/[a-z]/, "Password must contain at least one lowercase letter").regex(/[A-Z]/, "Password must contain at least one uppercase letter").regex(/\d/, "Password must contain at least one number").regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});
async function POST(context) {
  try {
    let requestBody;
    try {
      requestBody = await context.request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: {
            type: "validation_error",
            message: "Invalid JSON in request body",
            details: []
          }
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const validationResult = RegisterSchema.safeParse(requestBody);
    if (!validationResult.success) {
      const validationErrors = validationResult.error.errors.map((error2) => ({
        field: error2.path.join("."),
        message: error2.message
      }));
      return new Response(
        JSON.stringify({
          error: {
            type: "validation_error",
            message: "Registration validation failed",
            details: validationErrors
          }
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const { email, password } = validationResult.data;
    const { data, error } = await context.locals.supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${context.url.origin}/logs`
      }
    });
    if (error) {
      return new Response(
        JSON.stringify({
          error: {
            type: "business_logic_error",
            message: error.message,
            details: error
          }
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    if (!data.user) {
      return new Response(
        JSON.stringify({
          error: {
            type: "business_logic_error",
            message: "Registration failed - user not created",
            details: []
          }
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    if (data.session) {
      try {
        const { error: sessionSetError } = await context.locals.supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });
        if (sessionSetError) {
          console.error("Register: Failed to set server session cookies:", sessionSetError);
        } else {
          console.log("Register: Server session set successfully");
        }
      } catch (setErr) {
        console.error("Register: Exception while setting server session:", setErr);
      }
    }
    const authResponse = {
      user: {
        id: data.user.id,
        email: data.user.email || email
      },
      session: data.session ? {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at || 0
      } : {
        access_token: "",
        refresh_token: "",
        expires_at: 0
      }
    };
    return new Response(JSON.stringify({ data: authResponse }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error during registration:", error);
    return new Response(
      JSON.stringify({
        error: {
          type: "business_logic_error",
          message: "Registration failed",
          details: error instanceof Error ? error.message : "Unknown error"
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
