import { z } from 'zod';
export { renderers } from '../../../renderers.mjs';

const prerender = false;
const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address")
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
    const validationResult = ForgotPasswordSchema.safeParse(requestBody);
    if (!validationResult.success) {
      const validationErrors = validationResult.error.errors.map((error2) => ({
        field: error2.path.join("."),
        message: error2.message
      }));
      return new Response(
        JSON.stringify({
          error: {
            type: "validation_error",
            message: "Password reset validation failed",
            details: validationErrors
          }
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const { email } = validationResult.data;
    const { error } = await context.locals.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${context.url.origin}/reset-password`
    });
    if (error) {
      return new Response(
        JSON.stringify({
          error: {
            type: "business_logic_error",
            message: "Password reset request failed",
            details: error
          }
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    return new Response(
      JSON.stringify({
        data: {
          message: "If an account with this email exists, you will receive a password reset link."
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error during password reset request:", error);
    return new Response(
      JSON.stringify({
        error: {
          type: "business_logic_error",
          message: "Password reset request failed",
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
